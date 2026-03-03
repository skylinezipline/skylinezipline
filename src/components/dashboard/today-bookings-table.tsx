import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn, formatTime, formatCurrency, getTourTypeLabel, getStatusColor } from "@/lib/utils";
import { ArrowRight, Users } from "lucide-react";

interface Booking {
  id: string;
  confirmationNum: string;
  status: string;
  tourType: string;
  timeSlot: string;
  guestCount: number;
  totalPrice: number;
  guestName: string;
  source: string;
}

export function TodayBookingsTable({ bookings }: { bookings: Booking[] }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-semibold">Today&apos;s Schedule</CardTitle>
        <Link href="/ops/bookings">
          <Button variant="ghost" size="sm" className="text-xs gap-1">
            View All <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-slate-50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Confirmation</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Group</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Tour</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Guests</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Revenue</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {bookings.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs font-medium text-slate-700">
                    {formatTime(b.timeSlot)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/ops/bookings/${b.id}`}
                      className="font-medium text-skyline-600 hover:underline"
                    >
                      {b.confirmationNum}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-slate-700">{b.guestName}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">
                    {getTourTypeLabel(b.tourType)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-1 text-slate-600">
                      <Users className="h-3.5 w-3.5" />
                      {b.guestCount}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700">
                    {formatCurrency(b.totalPrice)}
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
