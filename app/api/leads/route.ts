import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const locationId = searchParams.get("locationId")

  const leads = await db.lead.findMany({
    where: {
      location: { organizationId: session.user.organizationId! },
      ...(locationId && { locationId }),
    },
    include: { notes: { orderBy: { createdAt: "desc" } } },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(leads)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const lead = await db.lead.create({
    data: body,
    include: { notes: true },
  })
  return NextResponse.json(lead, { status: 201 })
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { ids } = await req.json()
  await db.lead.deleteMany({ where: { id: { in: ids } } })
  return NextResponse.json({ success: true })
}
