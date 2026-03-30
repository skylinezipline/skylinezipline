import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json()
  if (body.status === "COMPLETED" && !body.completedAt) {
    body.completedAt = new Date().toISOString()
  }
  const task = await db.maintenanceTask.update({
    where: { id: params.id },
    data: body,
    include: { assignedTo: true },
  })
  return NextResponse.json(task)
}
