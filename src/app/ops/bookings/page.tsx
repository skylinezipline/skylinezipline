import { Metadata } from "next";
import Link from "next/link";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  cn,
  formatCurrency,
  formatTime,
  getTourTypeLabel,
  getStatusColor,
} from "@/lib/utils";
import { mockTodayBookings } from "@/lib/mock-data";
import {
  PlusCircle,
  Search,
  Filter,
  Users,
  ChevronRight,
  CalendarDays,
} from "lucide-react";

export const metadata: Metadata = { title: "Bookings" };

const allBookings = [
  ...mockTodayBookings,
  {
    id: "b7",
    confirmationNum: "SZL-097",
    status: "COMPLETED",
    tourType: "ADVENTURE",
    timeSlot: "09:00",
    guestCount: 4,
    totalPrice: 520,
    guestName: "Thompson Family",
    source: "website",
    date: "2026-03-02",
  },
  {
    id: "b8",
    confirmationNum: "SZL-098",
    status: "COMPLETED",
    tourType: "CLASSIC",
    timeSlot: "11:00",
    guestCount: 3,
    totalPrice: 345,
    guestName: "Kim Party",
    source: "phone",
    date: "2026-03-02",
  },
  {
    id: "b9",
    confirmationNum: "SZL-099",
    status: "CANCELLED",
    tourType: "INTRO",
    timeSlot: "14:00",
    guestCount: 2,
    totalPrice: 180,
    guestName: "Anderson, Mark",
    source: "website",
    date: "2026-03-02",
  },
];

const statusFilters = [
  "All",
  "PENDING",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

export default function BookingsPage() {
  return (
    <div className="flex flex-col">
      <Topbar title="Bookings" subtitle="Manage reservations and tours" />

      <div className="space-y-6 p-6">
        {/* Header actions */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search bookings, guests..."
                className="w-64 pl-8"
              />
            </div>
            <Button variant="outline" size="sm" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
          </div>
          <Link href="/ops/bookings/new">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              New Booking
            </Button>
          </Link>
        </div>

        {/* Status filter tabs */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {statusFilters.map((s) => (
            <button
              key={s}
              className={cn(
                "flex-shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                s === "All"
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-background text-muted-foreground hover:border-primary hover:text-primary"
              )}
            >
              {s === "All" ? "All Bookings" : s.replace(/_/g, " ")}
            </button>
          ))}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Today", value: "12", sub: "bookings" },
            { label: "This Week", value: "74", sub: "bookings" },
            { label: "Pending", value: "3", sub: "need action" },
            { label: "Cancelled", value: "1", sub: "this week" },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Bookings Table */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2 pb-2">
            <CalendarDays className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">
              All Bookings
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    {[
                      "Confirmation",
                      "Date",
                      "Time",
                      "Group",
                      "Tour",
                      "Guests",
                      "Revenue",
                      "Source",
                      "Status",
                      "",
                    ].map((h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-muted-foreground"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {allBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-slate-50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <Link
                          href={`/ops/bookings/${b.id}`}
                          className="font-medium text-skyline-600 hover:underline"
                        >
                          {b.confirmationNum}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {("date" in b ? b.date : "Today")}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {formatTime(b.timeSlot)}
                      </td>
                      <td className="px-4 py-3 font-medium">{b.guestName}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {getTourTypeLabel(b.tourType)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-1">
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          {b.guestCount}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {formatCurrency(b.totalPrice)}
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize text-xs text-muted-foreground">
                          {b.source}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            getStatusColor(b.status)
                          )}
                        >
                          {b.status.replace(/_/g, " ")}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/ops/bookings/${b.id}`}>
                          <Button variant="ghost" size="icon" className="h-7 w-7">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
