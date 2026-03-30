import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const locationId = searchParams.get("locationId")
  const startDate = searchParams.get("startDate")
  const endDate = searchParams.get("endDate")

  const schedules = await db.dailyStaffSchedule.findMany({
    where: {
      location: { organizationId: session.user.organizationId! },
      ...(locationId && { locationId }),
      ...(startDate && endDate && { date: { gte: startDate, lte: endDate } }),
    },
    include: {
      assignments: { include: { staff: true } },
    },
    orderBy: { date: "asc" },
  })

  return NextResponse.json(schedules)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { assignments, ...data } = await req.json()

  const schedule = await db.dailyStaffSchedule.create({
    data: {
      ...data,
      assignments: { create: assignments ?? [] },
    },
    include: { assignments: { include: { staff: true } } },
  })
  return NextResponse.json(schedule, { status: 201 })
}
