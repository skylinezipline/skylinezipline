import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const equipmentId = searchParams.get("equipmentId")

  const inspections = await db.inspection.findMany({
    where: {
      equipment: { location: { organizationId: session.user.organizationId! } },
      ...(equipmentId && { equipmentId }),
    },
    include: { checklist: true, inspector: true, equipment: true },
    orderBy: { date: "desc" },
  })

  return NextResponse.json(inspections)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { checklist, ...data } = await req.json()

  const inspection = await db.inspection.create({
    data: {
      ...data,
      checklist: { create: checklist ?? [] },
    },
    include: { checklist: true },
  })

  // Update equipment's lastInspectionDate
  await db.equipmentItem.update({
    where: { id: data.equipmentId },
    data: { lastInspectionDate: data.date },
  })

  // Auto-create maintenance task on fail or needs adjustment
  if (data.overallResult === "FAIL" || data.overallResult === "NEEDS_ADJUSTMENT") {
    const equipment = await db.equipmentItem.findUnique({ where: { id: data.equipmentId } })
    await db.maintenanceTask.create({
      data: {
        equipmentId: data.equipmentId,
        inspectionId: inspection.id,
        title: `${data.overallResult === "FAIL" ? "Fail" : "Needs Adjustment"}: ${equipment?.serialNumber ?? data.equipmentId}`,
        description: `Auto-created from inspection. ${data.notes ?? ""}`.trim(),
        status: "OPEN",
        priority: data.overallResult === "FAIL" ? "CRITICAL" : "MEDIUM",
        partsUsed: [],
        laborNotes: "",
      },
    })
  }

  return NextResponse.json(inspection, { status: 201 })
}
