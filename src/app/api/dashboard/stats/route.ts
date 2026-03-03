import { NextResponse } from "next/server";
import { mockDashboardStats } from "@/lib/mock-data";

// GET /api/dashboard/stats
// Returns today's operational stats for the dashboard
// TODO: Replace mock data with real Prisma queries
export async function GET() {
  try {
    // In production:
    // const today = startOfDay(new Date());
    // const [bookings, guests, revenue] = await Promise.all([
    //   db.booking.count({ where: { date: { gte: today } } }),
    //   db.guest.count({ where: { booking: { date: { gte: today } } } }),
    //   db.booking.aggregate({ _sum: { totalPrice: true }, where: { date: { gte: today } } }),
    // ]);

    return NextResponse.json(mockDashboardStats);
  } catch (error) {
    console.error("[DASHBOARD_STATS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
