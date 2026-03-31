import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { createHmac } from "crypto"

// Generate a signed waiver token for a guest
export async function POST(req: Request) {
  const { bookingId, guestId } = await req.json()

  if (!bookingId || !guestId) {
    return NextResponse.json({ error: "Missing bookingId or guestId" }, { status: 400 })
  }

  const guest = await db.bookingGuest.findUnique({
    where: { id: guestId },
    include: { booking: { include: { location: true } } },
  })
  if (!guest) return NextResponse.json({ error: "Guest not found" }, { status: 404 })

  // Create a signed token: HMAC(secret, guestId:bookingId:expiry)
  const expiry = Date.now() + 1000 * 60 * 60 * 72 // 72 hours
  const payload = `${guestId}:${bookingId}:${expiry}`
  const secret = process.env.NEXTAUTH_SECRET ?? "fallback-secret"
  const sig = createHmac("sha256", secret).update(payload).digest("hex")
  const token = Buffer.from(`${payload}:${sig}`).toString("base64url")

  const waiverUrl = `${process.env.NEXTAUTH_URL}/waiver/${token}`

  return NextResponse.json({ token, waiverUrl })
}

// Verify and retrieve waiver data from token
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const token = searchParams.get("token")
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 })

  const { guest, error } = await resolveWaiverToken(token)
  if (error || !guest) return NextResponse.json({ error }, { status: 400 })

  return NextResponse.json(guest)
}

export async function resolveWaiverToken(token: string) {
  try {
    const decoded = Buffer.from(token, "base64url").toString()
    const [guestId, bookingId, expiryStr, sig] = decoded.split(":")
    const expiry = parseInt(expiryStr, 10)

    if (Date.now() > expiry) return { error: "Waiver link has expired", guest: null }

    const secret = process.env.NEXTAUTH_SECRET ?? "fallback-secret"
    const payload = `${guestId}:${bookingId}:${expiryStr}`
    const expectedSig = createHmac("sha256", secret).update(payload).digest("hex")
    if (sig !== expectedSig) return { error: "Invalid waiver token", guest: null }

    const guest = await db.bookingGuest.findUnique({
      where: { id: guestId },
      include: {
        booking: {
          include: { location: true },
        },
      },
    })
    if (!guest) return { error: "Guest not found", guest: null }

    return { guest, error: null }
  } catch {
    return { error: "Invalid token", guest: null }
  }
}
