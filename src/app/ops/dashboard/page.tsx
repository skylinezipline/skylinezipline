import { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { StatCard } from "@/components/dashboard/stat-card";
import { TodayBookingsTable } from "@/components/dashboard/today-bookings-table";
import { WeatherBanner } from "@/components/dashboard/weather-banner";
import { StaffOnDuty } from "@/components/dashboard/staff-on-duty";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { RevenueChart } from "@/components/dashboard/revenue-chart";
import {
  mockDashboardStats,
  mockTodayBookings,
  mockStaff,
  mockRevenueData,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import {
  CalendarDays,
  Users,
  DollarSign,
  UserCheck,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  const { today, week, month } = mockDashboardStats;

  return (
    <div className="flex flex-col">
      <Topbar
        title="Operations Dashboard"
        subtitle={new Date().toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      />

      <div className="flex-1 space-y-6 p-6">
        {/* Weather/Ops Status Banner */}
        <WeatherBanner
          status={today.operationalStatus}
          temp={today.weatherTemp}
          wind={today.weatherWind}
          condition={today.weatherStatus}
        />

        {/* Today Stats */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Today
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Bookings"
              value={today.totalBookings}
              subtitle={`${today.openSlots} slots still open`}
              icon={CalendarDays}
              color="blue"
            />
            <StatCard
              title="Confirmed Guests"
              value={today.confirmedGuests}
              subtitle="across all tours"
              icon={Users}
              color="purple"
            />
            <StatCard
              title="Today's Revenue"
              value={formatCurrency(today.revenue)}
              subtitle="projected from bookings"
              icon={DollarSign}
              color="green"
            />
            <StatCard
              title="Guides On Duty"
              value={today.guidesScheduled}
              subtitle="scheduled for today"
              icon={UserCheck}
              color="orange"
            />
          </div>
        </div>

        {/* MTD / Week Stats */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            This Month
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              title="Total Bookings"
              value={month.bookings}
              subtitle={`${week.bookings} this week`}
              icon={CalendarDays}
              color="blue"
              size="sm"
            />
            <StatCard
              title="Total Guests"
              value={month.guests.toLocaleString()}
              subtitle={`${week.guests} this week`}
              icon={Users}
              color="purple"
              size="sm"
            />
            <StatCard
              title="Revenue"
              value={formatCurrency(month.revenue)}
              subtitle={`${formatCurrency(week.revenue)} this week`}
              icon={TrendingUp}
              color="green"
              size="sm"
            />
            <StatCard
              title="Avg Occupancy"
              value={`${month.avgOccupancy}%`}
              subtitle="capacity utilization"
              icon={AlertTriangle}
              color="orange"
              size="sm"
            />
          </div>
        </div>

        {/* Main grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Today's bookings table — spans 2 cols */}
          <div className="lg:col-span-2">
            <TodayBookingsTable bookings={mockTodayBookings} />
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <QuickActions />
            <StaffOnDuty staff={mockStaff.filter((s) => s.todayShift)} />
          </div>
        </div>

        {/* Revenue Chart */}
        <RevenueChart data={mockRevenueData} />
      </div>
    </div>
  );
}
