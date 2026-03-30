import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const locationId = searchParams.get("locationId")

  const equipment = await db.equipmentItem.findMany({
    where: {
      location: { organizationId: session.user.organizationId! },
      ...(locationId && { locationId }),
    },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(equipment)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const item = await db.equipmentItem.create({ data: body })
  return NextResponse.json(item, { status: 201 })
}
