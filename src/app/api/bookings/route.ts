import { NextRequest, NextResponse } from "next/server";

// GET /api/bookings — list bookings with filters
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date");
  const status = searchParams.get("status");
  const limit = parseInt(searchParams.get("limit") ?? "50");
  const offset = parseInt(searchParams.get("offset") ?? "0");

  try {
    // TODO: Replace with Prisma query
    // const bookings = await db.booking.findMany({
    //   where: {
    //     ...(date ? { date: { gte: new Date(date), lt: addDays(new Date(date), 1) } } : {}),
    //     ...(status ? { status: status as BookingStatus } : {}),
    //   },
    //   include: { guests: true, assignedGuides: { include: { staff: true } } },
    //   orderBy: [{ date: "asc" }, { timeSlot: "asc" }],
    //   take: limit,
    //   skip: offset,
    // });

    return NextResponse.json({
      data: [],
      total: 0,
      filters: { date, status, limit, offset },
    });
  } catch (error) {
    console.error("[BOOKINGS_GET]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST /api/bookings — create new booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tourType, date, timeSlot, guestCount, totalPrice, guests, notes, source } = body;

    // Validate required fields
    if (!tourType || !date || !timeSlot || !guestCount) {
      return NextResponse.json(
        { error: "Missing required fields: tourType, date, timeSlot, guestCount" },
        { status: 400 }
      );
    }

    // TODO: Replace with real Prisma mutation
    // const booking = await db.booking.create({
    //   data: {
    //     tourType,
    //     date: new Date(date),
    //     timeSlot,
    //     guestCount,
    //     totalPrice,
    //     notes,
    //     source,
    //     status: "PENDING",
    //     guests: { createMany: { data: guests } },
    //   },
    //   include: { guests: true },
    // });

    return NextResponse.json({ message: "Booking created (mock)" }, { status: 201 });
  } catch (error) {
    console.error("[BOOKINGS_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
