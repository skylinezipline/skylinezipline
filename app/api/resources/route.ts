import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(_req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const resources = await db.resource.findMany({
    where: { organizationId: session.user.organizationId! },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(resources)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const resource = await db.resource.create({
    data: { ...body, organizationId: session.user.organizationId! },
  })
  return NextResponse.json(resource, { status: 201 })
}
