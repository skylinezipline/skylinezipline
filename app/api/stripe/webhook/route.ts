import { NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"
import type Stripe from "stripe"

export const config = { api: { bodyParser: false } }

export async function POST(req: Request) {
  const body = await req.text()
  const sig = req.headers.get("stripe-signature")

  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Missing signature or webhook secret" }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch {
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 })
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session
      const { bookingId, organizationId } = session.metadata ?? {}

      if (bookingId && organizationId) {
        // Mark booking as paid
        await db.booking.update({
          where: { id: bookingId },
          data: { paymentStatus: "PAID" },
        })

        // Mark related invoice as paid
        await db.invoice.updateMany({
          where: { bookingId },
          data: {
            status: "PAID",
            paidDate: new Date().toISOString().split("T")[0],
          },
        })

        // Create a notification
        await db.notification.create({
          data: {
            organizationId,
            type: "PAYMENT",
            title: "Payment received",
            description: `Booking ${bookingId} has been paid via Stripe.`,
          },
        })
      }
      break
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session
      const { bookingId } = session.metadata ?? {}
      if (bookingId) {
        await db.booking.update({
          where: { id: bookingId },
          data: { paymentStatus: "PENDING" },
        })
      }
      break
    }

    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge
      const bookingId = charge.metadata?.bookingId
      if (bookingId) {
        await db.booking.update({
          where: { id: bookingId },
          data: { paymentStatus: "REFUNDED" },
        })
        await db.invoice.updateMany({
          where: { bookingId },
          data: { status: "VOID" },
        })
      }
      break
    }
  }

  return NextResponse.json({ received: true })
}
