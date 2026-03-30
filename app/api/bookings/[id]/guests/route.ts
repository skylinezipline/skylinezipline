import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { guestId, ...updates } = await req.json()

  const guest = await db.bookingGuest.update({
    where: { id: guestId },
    data: updates,
  })

  // If guardian signed, cover their minors
  if (updates.waiverStatus === "SIGNED") {
    await db.bookingGuest.updateMany({
      where: { guardianGuestId: guestId },
      data: { waiverStatus: "COVERED" },
    })
  }

  return NextResponse.json(guest)
}
