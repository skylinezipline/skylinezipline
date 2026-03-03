import { NextRequest, NextResponse } from "next/server";

// GET /api/equipment
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const category = searchParams.get("category");

  try {
    // TODO: Prisma
    // const equipment = await db.equipment.findMany({
    //   where: {
    //     ...(status ? { status: status as EquipmentStatus } : {}),
    //     ...(category ? { category: category as EquipmentCategory } : {}),
    //   },
    //   include: { inspections: { orderBy: { date: "desc" }, take: 1 } },
    //   orderBy: { name: "asc" },
    // });

    return NextResponse.json({ data: [], filters: { status, category } });
  } catch (error) {
    console.error("[EQUIPMENT_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/equipment/inspect — log an inspection
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { equipmentId, type, passed, findings, inspectedBy } = body;

    if (!equipmentId || !type || passed === undefined || !inspectedBy) {
      return NextResponse.json(
        { error: "Missing required fields: equipmentId, type, passed, inspectedBy" },
        { status: 400 }
      );
    }

    // TODO: Prisma
    // const inspection = await db.inspection.create({
    //   data: { equipmentId, type, passed, findings, inspectedBy, status: passed ? "PASSED" : "FAILED" },
    // });
    // if (!passed) {
    //   await db.equipment.update({ where: { id: equipmentId }, data: { status: "OUT_OF_SERVICE" } });
    // }

    return NextResponse.json({ message: "Inspection logged (mock)" }, { status: 201 });
  } catch (error) {
    console.error("[EQUIPMENT_INSPECT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
