import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { bookingId, lineItems, successUrl, cancelUrl } = await req.json()

  // Verify booking belongs to this org
  const booking = await db.booking.findFirst({
    where: {
      id: bookingId,
      location: { organizationId: session.user.organizationId! },
    },
  })
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 })

  const checkoutSession = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    mode: "payment",
    line_items: lineItems.map((item: { name: string; amount: number; quantity: number }) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name },
        unit_amount: Math.round(item.amount * 100), // cents
      },
      quantity: item.quantity,
    })),
    metadata: {
      bookingId,
      organizationId: session.user.organizationId!,
    },
    success_url: successUrl ?? `${process.env.NEXTAUTH_URL}/ops/payments?success=1`,
    cancel_url: cancelUrl ?? `${process.env.NEXTAUTH_URL}/ops/bookings`,
  })

  return NextResponse.json({ url: checkoutSession.url })
}
