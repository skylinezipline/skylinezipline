import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { resolveWaiverToken } from "../route"

export async function POST(req: Request) {
  const { token, signatureName, agreedToTerms } = await req.json()

  if (!token || !signatureName || !agreedToTerms) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
  }

  const { guest, error } = await resolveWaiverToken(token)
  if (error || !guest) return NextResponse.json({ error }, { status: 400 })

  if (guest.waiverStatus === "SIGNED") {
    return NextResponse.json({ error: "Waiver already signed" }, { status: 409 })
  }

  // Mark guest waiver as signed
  await db.bookingGuest.update({
    where: { id: guest.id },
    data: { waiverStatus: "SIGNED" },
  })

  // If this guest is a guardian, cover all their minors
  await db.bookingGuest.updateMany({
    where: { guardianGuestId: guest.id },
    data: { waiverStatus: "COVERED" },
  })

  return NextResponse.json({ success: true })
}
