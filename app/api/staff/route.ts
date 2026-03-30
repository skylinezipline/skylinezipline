import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const locationId = searchParams.get("locationId")

  const staff = await db.staff.findMany({
    where: {
      organizationId: session.user.organizationId!,
      ...(locationId && { locationId }),
    },
    include: { certificates: true },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(staff)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const member = await db.staff.create({
    data: { ...body, organizationId: session.user.organizationId! },
  })
  return NextResponse.json(member, { status: 201 })
}
