import { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn, formatTime, getTourTypeLabel, getStatusColor } from "@/lib/utils";
import { mockTodayBookings } from "@/lib/mock-data";
import {
  Search,
  UserCheck,
  ClipboardCheck,
  ShieldCheck,
  HardHat,
  ChevronRight,
  Clock,
  Users,
  CheckCircle2,
  Circle,
} from "lucide-react";

export const metadata: Metadata = { title: "Check-In" };

const checkInQueue = mockTodayBookings.filter((b) =>
  ["CONFIRMED", "PENDING", "CHECKED_IN"].includes(b.status)
);

interface ChecklistItem {
  label: string;
  icon: React.ElementType;
  done: boolean;
}

function ChecklistRow({ item }: { item: ChecklistItem }) {
  return (
    <div className="flex items-center gap-2.5 text-sm">
      {item.done ? (
        <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
      )}
      <item.icon className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
      <span className={item.done ? "text-slate-500 line-through" : "text-slate-700"}>
        {item.label}
      </span>
    </div>
  );
}

export default function CheckInPage() {
  return (
    <div className="flex flex-col">
      <Topbar
        title="Guest Check-In"
        subtitle="Arrival processing, waivers & pre-flight briefing"
      />

      <div className="space-y-6 p-6">
        {/* Search / Lookup */}
        <Card className="border-2 border-dashed border-skyline-200 bg-skyline-50/30">
          <CardContent className="flex flex-col items-center gap-4 py-8 sm:flex-row">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-skyline-100">
              <UserCheck className="h-7 w-7 text-skyline-600" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="font-semibold text-slate-800">Look Up Reservation</h3>
              <p className="text-sm text-muted-foreground">
                Enter confirmation number, guest name, or phone number
              </p>
            </div>
            <div className="flex w-full gap-2 sm:w-auto">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input placeholder="SZL-001 or guest name..." className="pl-8" />
              </div>
              <Button>Find</Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Arriving Soon", value: "4", color: "text-blue-600", sub: "next 90 min" },
            { label: "Checked In", value: "2", color: "text-purple-600", sub: "on property" },
            { label: "On Tour", value: "1", color: "text-green-600", sub: "in progress" },
            { label: "Waivers Pending", value: "3", color: "text-orange-600", sub: "need signature" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className={cn("text-2xl font-bold", s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Check-in Queue */}
          <div className="lg:col-span-2 space-y-3">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Today&apos;s Check-In Queue
            </h2>
            {checkInQueue.map((booking) => {
              const isCheckedIn = booking.status === "CHECKED_IN";
              const checklist: ChecklistItem[] = [
                { label: "ID / Waiver Verified", icon: ClipboardCheck, done: isCheckedIn },
                { label: "Weight / Height Check", icon: ShieldCheck, done: isCheckedIn },
                { label: "Harness Fitted", icon: HardHat, done: false },
                { label: "Safety Briefing", icon: UserCheck, done: false },
              ];
              return (
                <Card
                  key={booking.id}
                  className={cn(
                    "transition-shadow hover:shadow-md",
                    isCheckedIn && "border-purple-200 bg-purple-50/30"
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800">
                            {booking.guestName}
                          </span>
                          <span className="font-mono text-xs text-muted-foreground">
                            {booking.confirmationNum}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                              getStatusColor(booking.status)
                            )}
                          >
                            {booking.status.replace(/_/g, " ")}
                          </span>
                        </div>
                        <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {formatTime(booking.timeSlot)}
                          </span>
                          <span>·</span>
                          <span>{getTourTypeLabel(booking.tourType)}</span>
                          <span>·</span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5" />
                            {booking.guestCount} guests
                          </span>
                        </div>
                        <div className="mt-3 grid grid-cols-2 gap-1.5">
                          {checklist.map((item) => (
                            <ChecklistRow key={item.label} item={item} />
                          ))}
                        </div>
                      </div>
                      <Button size="sm" variant={isCheckedIn ? "outline" : "default"} className="flex-shrink-0">
                        {isCheckedIn ? "View" : "Check In"}
                        <ChevronRight className="ml-1 h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Waiver Station */}
          <div className="space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Waiver Station
            </h2>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-sm">
                  <ClipboardCheck className="h-4 w-4 text-green-600" />
                  Digital Waiver Kiosk
                </CardTitle>
                <CardDescription className="text-xs">
                  Guests can sign waivers on the tablet or via SMS/email link
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full gap-2" variant="success">
                  <ClipboardCheck className="h-4 w-4" />
                  Open Waiver Kiosk
                </Button>
                <Button className="w-full gap-2" variant="outline">
                  Send Waiver via SMS
                </Button>
                <Button className="w-full gap-2" variant="outline">
                  Send Waiver via Email
                </Button>
                <div className="rounded-lg bg-green-50 border border-green-200 p-3 text-xs text-green-800">
                  <strong>14 of 17</strong> waivers signed for today&apos;s tours
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Guest Weight Log</CardTitle>
                <CardDescription className="text-xs">
                  Required for harness sizing — min 70 lbs, max 275 lbs
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex gap-2">
                  <Input placeholder="Weight (lbs)" type="number" className="flex-1" />
                  <Button variant="outline" size="sm">Log</Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  All guests must be weighed before harness assignment
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
