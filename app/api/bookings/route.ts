import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const locationId = searchParams.get("locationId")
  const date = searchParams.get("date")

  const bookings = await db.booking.findMany({
    where: {
      location: { organizationId: session.user.organizationId! },
      ...(locationId && { locationId }),
      ...(date && { date }),
    },
    include: { guests: true },
    orderBy: [{ date: "desc" }, { time: "asc" }],
  })

  return NextResponse.json(bookings)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const { guests, ...bookingData } = body

  const booking = await db.booking.create({
    data: {
      ...bookingData,
      guests: {
        create: guests ?? [],
      },
    },
    include: { guests: true },
  })

  // Increment slot booked count
  await db.timeSlot.update({
    where: { id: bookingData.slotId },
    data: { bookedCount: { increment: bookingData.partySize } },
  })

  return NextResponse.json(booking, { status: 201 })
}
