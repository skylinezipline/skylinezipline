import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { assignments, ...data } = await req.json()

  if (assignments) {
    await db.staffAssignment.deleteMany({ where: { scheduleId: params.id } })
  }

  const schedule = await db.dailyStaffSchedule.update({
    where: { id: params.id },
    data: {
      ...data,
      ...(assignments && { assignments: { create: assignments } }),
    },
    include: { assignments: { include: { staff: true } } },
  })
  return NextResponse.json(schedule)
}
