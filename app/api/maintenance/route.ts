import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const equipmentId = searchParams.get("equipmentId")

  const tasks = await db.maintenanceTask.findMany({
    where: {
      equipment: { location: { organizationId: session.user.organizationId! } },
      ...(equipmentId && { equipmentId }),
    },
    include: { assignedTo: true, equipment: true },
    orderBy: { createdAt: "desc" },
  })

  return NextResponse.json(tasks)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  const task = await db.maintenanceTask.create({
    data: body,
    include: { assignedTo: true },
  })
  return NextResponse.json(task, { status: 201 })
}
