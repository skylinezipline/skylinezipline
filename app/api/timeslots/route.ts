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

  const slots = await db.timeSlot.findMany({
    where: {
      ...(locationId && { locationId }),
      ...(date && { date }),
    },
    orderBy: { time: "asc" },
  })

  return NextResponse.json(slots)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const slot = await db.timeSlot.create({ data: body })
  return NextResponse.json(slot, { status: 201 })
}
