import { NextRequest, NextResponse } from "next/server";

// POST /api/safety — create incident report
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      date,
      location,
      type,
      severity,
      description,
      injuredParty,
      witnessNames,
      actionsTaken,
      reportedById,
    } = body;

    if (!date || !location || !type || !severity || !description || !reportedById) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // TODO: Prisma
    // const report = await db.incidentReport.create({
    //   data: {
    //     date: new Date(date),
    //     location,
    //     type,
    //     severity,
    //     description,
    //     injuredParty,
    //     witnessNames: witnessNames ?? [],
    //     actionsTaken,
    //     reportedById,
    //     status: "OPEN",
    //   },
    // });

    return NextResponse.json({ message: "Incident report filed (mock)" }, { status: 201 });
  } catch (error) {
    console.error("[SAFETY_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// GET /api/safety — list incident reports
export async function GET() {
  try {
    // TODO: Prisma
    // const reports = await db.incidentReport.findMany({
    //   include: { reportedBy: true },
    //   orderBy: { date: "desc" },
    // });
    return NextResponse.json({ data: [] });
  } catch (error) {
    console.error("[SAFETY_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
