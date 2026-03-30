import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const item = await db.equipmentItem.findUnique({
    where: { id: params.id },
    include: {
      inspections: {
        include: { checklist: true, inspector: true },
        orderBy: { date: "desc" },
      },
      maintenanceTasks: {
        include: { assignedTo: true },
        orderBy: { createdAt: "desc" },
      },
    },
  })
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(item)
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const item = await db.equipmentItem.update({ where: { id: params.id }, data: body })
  return NextResponse.json(item)
}
