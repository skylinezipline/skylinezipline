"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { format, addDays } from "date-fns"
import { Clock, FileWarning, CreditCard, Users, AlertTriangle, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import { WaiverStatusBar } from "@/components/waiver-status-bar"
import { useAppStore } from "@/lib/mock-store"
import { locations, timeSlots, generateOpsAlerts, staff } from "@/lib/mock-data"

export default function OpsDashboardPage() {
  const { state } = useAppStore()
  const router = useRouter()
  const location = locations.find(l => l.id === state.selectedLocationId)!

  const stableNow = useMemo(() => new Date("2026-02-14T12:00:00"), [])

  const [dateOffset, setDateOffset] = useState(0)
  const viewDate = useMemo(() => addDays(stableNow, dateOffset), [stableNow, dateOffset])
  const viewDateStr = format(viewDate, "yyyy-MM-dd")
  const isToday = dateOffset === 0
  const currentTime = format(stableNow, "HH:mm")

  const daySlots = useMemo(
    () => timeSlots
      .filter(s => s.date === viewDateStr && s.locationId === state.selectedLocationId)
      .sort((a, b) => a.time.localeCompare(b.time)),
    [viewDateStr, state.selectedLocationId]
  )

  const upcomingSlots = isToday
    ? daySlots.filter(s => s.time >= currentTime).slice(0, 6)
    : daySlots.filter(s => s.bookedCount > 0).slice(0, 6)

  const dayBookings = state.bookings.filter(
    b => b.date === viewDateStr && b.locationId === state.selectedLocationId && b.status !== "Cancelled"
  )
  const allGuests = dayBookings.flatMap(b => b.guests)
  const outstandingWaivers = allGuests.filter(g => g.waiverStatus === "Outstanding")
  const pendingPayments = dayBookings.filter(b => b.paymentStatus === "Pending")

  const twoHoursLater = format(new Date(stableNow.getTime() + 2 * 60 * 60 * 1000), "HH:mm")
  const next2HourSlots = isToday
    ? daySlots.filter(s => s.time >= currentTime && s.time <= twoHoursLater)
    : daySlots.filter(s => s.bookedCount > 0).slice(0, 6)
  const totalBooked = next2HourSlots.reduce((sum, s) => sum + s.bookedCount, 0)
  const totalCapacity = next2HourSlots.reduce((sum, s) => sum + s.capacity, 0)
  const utilizationRatio = totalCapacity > 0 ? totalBooked / totalCapacity : 0

  let suggestedStaff = 4
  if (utilizationRatio >= 0.5) suggestedStaff = 8
  else if (totalBooked > 0) suggestedStaff = 6

  const alerts = useMemo(
    () => generateOpsAlerts(state.selectedLocationId),
    [state.selectedLocationId]
  )

  const dayLabel = isToday
    ? "Today"
    : dateOffset === 1 ? "Tomorrow"
    : dateOffset === -1 ? "Yesterday"
    : format(viewDate, "EEEE")

  // Route mapping for alerts
  const alertRouteMap: Record<string, string> = {
    "waiver-gap": "/ops/schedule",
    "overbooked": "/ops/schedule",
    "missing-staff": "/admin/staffing",
    "certificate": "/admin/certificates",
    "equipment": "/admin/equipment-inventory",
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header with day navigation */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-balance">
            {dayLabel} at {location.name}
          </h1>
          <p className="text-muted-foreground">{format(viewDate, "EEEE, MMMM d, yyyy")}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setDateOffset(d => d - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {!isToday && (
            <Button variant="ghost" size="sm" onClick={() => setDateOffset(0)}>Today</Button>
          )}
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => setDateOffset(d => d + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push("/ops/schedule")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span className="text-sm">{isToday ? "Upcoming Slots" : "Active Slots"}</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{upcomingSlots.length}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push("/ops/bookings")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span className="text-sm">Guests {dayLabel}</span>
            </div>
            <p className="mt-1 text-2xl font-bold">{allGuests.length}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push("/ops/schedule")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <FileWarning className="h-4 w-4" />
              <span className="text-sm">Waivers Pending</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-destructive">{outstandingWaivers.length}</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => router.push("/ops/payments")}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <CreditCard className="h-4 w-4" />
              <span className="text-sm">Payments Pending</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-accent">{pendingPayments.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Next Departures - clickable to schedule detail */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">{isToday ? "Next Departures" : "Departures"}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {upcomingSlots.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  {isToday ? "No more departures today" : "No departures with bookings"}
                </p>
              ) : (
                upcomingSlots.map(slot => {
                  const slotBookings = dayBookings.filter(b => b.slotId === slot.id)
                  const slotGuests = slotBookings.flatMap(b => b.guests)
                  const assignedStaff = slot.assignedStaffIds.map(id => staff.find(s => s.id === id)).filter(Boolean)
                  return (
                    <div
                      key={slot.id}
                      className="flex items-center gap-4 rounded-lg border p-3 cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => router.push("/ops/schedule")}
                    >
                      <div className="text-center">
                        <p className="text-lg font-bold font-mono">{slot.time}</p>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{slot.bookedCount}/{slot.capacity} guests</span>
                          <StatusBadge status={slot.status} />
                        </div>
                        <div className="mt-1 flex items-center gap-3">
                          <span className="text-xs text-muted-foreground">
                            {assignedStaff.map(s => s?.name.split(" ")[0]).join(", ") || "No staff"}
                          </span>
                          {slotGuests.length > 0 && (
                            <WaiverStatusBar guests={slotGuests} className="w-24" />
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="flex flex-col gap-6">
          {/* Staffing Suggestion - clickable to staffing section */}
          <Card
            className="cursor-pointer hover:bg-muted/50 transition-colors"
            onClick={() => router.push("/admin/staffing")}
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Staffing Suggestion</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-2 py-2">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-2xl font-bold text-primary">{suggestedStaff}</span>
                </div>
                <p className="text-sm font-medium">Staff recommended</p>
                <p className="text-center text-xs text-muted-foreground">
                  Based on {totalBooked} guests booked across {next2HourSlots.length} slots
                  {isToday ? " in the next 2 hours" : ""}
                </p>
                <Badge variant="outline" className="text-xs">Click to manage staffing</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Ops Alerts - clickable to respective sections */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-accent" />
                <CardTitle className="text-base">Ops Alerts</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {alerts.length === 0 ? (
                <p className="py-4 text-center text-sm text-muted-foreground">All clear - no alerts</p>
              ) : (
                alerts.slice(0, 5).map(alert => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-2 rounded-md border p-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => {
                      const route = alertRouteMap[alert.type] || "/ops/schedule"
                      router.push(route)
                    }}
                  >
                    <div className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                      alert.severity === "critical" ? "bg-destructive" :
                      alert.severity === "warning" ? "bg-accent" : "bg-chart-3"
                    }`} />
                    <div>
                      <p className="text-sm font-medium">{alert.title}</p>
                      <p className="text-xs text-muted-foreground">{alert.description}</p>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
