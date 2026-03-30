import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const booking = await db.booking.findUnique({
    where: { id: params.id },
    include: { guests: true },
  })
  if (!booking) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(booking)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const booking = await db.booking.update({
    where: { id: params.id },
    data: body,
    include: { guests: true },
  })
  return NextResponse.json(booking)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  await db.booking.delete({ where: { id: params.id } })
  return NextResponse.json({ success: true })
}
