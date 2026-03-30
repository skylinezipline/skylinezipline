import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(_req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const campaigns = await db.campaign.findMany({
    where: { organizationId: session.user.organizationId! },
    orderBy: { startDate: "desc" },
  })

  return NextResponse.json(campaigns)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const campaign = await db.campaign.create({
    data: { ...body, organizationId: session.user.organizationId! },
  })
  return NextResponse.json(campaign, { status: 201 })
}
