import { NextRequest, NextResponse } from "next/server";

// POST /api/checkin — process guest arrival and update booking status
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, allWaiversSigned, harnessChecked, briefingComplete, briefingGuide } = body;

    if (!bookingId) {
      return NextResponse.json({ error: "bookingId is required" }, { status: 400 });
    }

    // TODO: replace with Prisma
    // const checkIn = await db.checkIn.upsert({
    //   where: { bookingId },
    //   update: { allWaiversSigned, harnessChecked, briefingComplete, briefingGuide },
    //   create: { bookingId, allWaiversSigned: false, harnessChecked: false, briefingComplete: false },
    // });
    // await db.booking.update({
    //   where: { id: bookingId },
    //   data: { status: "CHECKED_IN" },
    // });

    return NextResponse.json({ message: "Check-in processed (mock)", bookingId });
  } catch (error) {
    console.error("[CHECKIN_POST]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
