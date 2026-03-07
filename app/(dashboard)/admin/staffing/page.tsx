"use client"

import { useState, useMemo, useCallback, useEffect } from "react"
import { format, addDays, startOfWeek, getDay } from "date-fns"
import {
  ChevronLeft, ChevronRight, Users, Zap, Sun, CalendarClock,
  Snowflake, UserPlus, X, RefreshCw, Check, AlertTriangle, Star,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { KPIStatCard } from "@/components/kpi-stat-card"
import { StatusBadge } from "@/components/status-badge"
import { useAppStore } from "@/lib/mock-store"
import { staff as allStaff, timeSlots } from "@/lib/mock-data"
import { generateSchedules, isOperatingDay, calculateStaffNeeds, autoAllocate } from "@/lib/staffing-engine"
import type { DailyStaffSchedule, StaffAssignment, StaffRole } from "@/lib/types"
import { toast } from "sonner"

const ROLE_COLORS: Record<StaffRole, string> = {
  "Lead Guide": "bg-chart-1/15 text-chart-1 border-chart-1/30",
  "Guide": "bg-chart-2/15 text-chart-2 border-chart-2/30",
  "Ground Crew": "bg-chart-3/15 text-chart-3 border-chart-3/30",
  "Check-in Attendant": "bg-chart-4/15 text-chart-4 border-chart-4/30",
  "Manager": "bg-primary/15 text-primary border-primary/30",
  "Admin": "bg-muted text-muted-foreground border-muted",
}

const ROLE_ICONS: Record<string, React.ReactNode> = {
  "Lead Guide": <Star className="h-3 w-3" />,
  "Guide": <Users className="h-3 w-3" />,
  "Ground Crew": <Zap className="h-3 w-3" />,
  "Check-in Attendant": <Check className="h-3 w-3" />,
}

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function StaffingPage() {
  const { state, dispatch } = useAppStore()
  const stableTodayStr = useMemo(() => "2026-02-14", [])
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDaySchedule, setSelectedDaySchedule] = useState<DailyStaffSchedule | null>(null)
  const [addStaffDialog, setAddStaffDialog] = useState(false)
  const [addStaffRole, setAddStaffRole] = useState<StaffRole>("Guide")

  const weekStart = useMemo(
    () => addDays(startOfWeek(new Date("2026-02-14T12:00:00"), { weekStartsOn: 1 }), weekOffset * 7),
    [weekOffset]
  )

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  )

  // Generate schedules on mount or when week/location changes
  const regenerateSchedules = useCallback(() => {
    const schedules = generateSchedules(
      weekDates[0],
      7,
      state.selectedLocationId,
      allStaff,
      timeSlots
    )
    dispatch({ type: "SET_STAFF_SCHEDULES", schedules })
  }, [weekDates, state.selectedLocationId, dispatch])

  useEffect(() => {
    regenerateSchedules()
  }, [regenerateSchedules])

  // Build the week grid data
  const weekSchedules = useMemo(() => {
    return weekDates.map(date => {
      const dateStr = format(date, "yyyy-MM-dd")
      const isOp = isOperatingDay(date)
      const schedule = state.staffSchedules.find(
        s => s.date === dateStr && s.locationId === state.selectedLocationId
      )
      return { date, dateStr, isOperating: isOp, schedule }
    })
  }, [weekDates, state.staffSchedules, state.selectedLocationId])

  // KPI aggregates for the current week
  const weekStats = useMemo(() => {
    const schedules = weekSchedules.filter(w => w.schedule)
    const totalStaffShifts = schedules.reduce((sum, w) => sum + (w.schedule?.assignments.length ?? 0), 0)
    const totalGuests = schedules.reduce((sum, w) => sum + (w.schedule?.totalGuests ?? 0), 0)
    const avgStaff = schedules.length > 0 ? (totalStaffShifts / schedules.length).toFixed(1) : "0"
    const understaffedDays = schedules.filter(w => {
      if (!w.schedule) return false
      const daySlots = timeSlots.filter(s => s.date === w.schedule!.date && s.locationId === state.selectedLocationId)
      const needs = calculateStaffNeeds(daySlots, {
        isWeekend: w.schedule!.isWeekend,
        isHoliday: w.schedule!.isHoliday,
      })
      const totalNeeded = needs.reduce((s, n) => s + n.count, 0)
      return w.schedule!.assignments.length < totalNeeded
    }).length

    return { totalStaffShifts, totalGuests, avgStaff, understaffedDays, operatingDays: schedules.length }
  }, [weekSchedules, state.selectedLocationId])

  // Staff available for adding to a day
  const availableToAdd = useMemo(() => {
    if (!selectedDaySchedule) return []
    const assignedIds = new Set(selectedDaySchedule.assignments.map(a => a.staffId))
    const dayOfWeek = DAY_NAMES[getDay(new Date(selectedDaySchedule.date + "T12:00:00"))] as "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
    return allStaff.filter(s => {
      if (s.locationId !== state.selectedLocationId) return false
      if (s.role === "Manager" || s.role === "Admin") return false
      if (assignedIds.has(s.id)) return false
      if (s.availability && !s.availability.includes(dayOfWeek)) return false
      return true
    })
  }, [selectedDaySchedule, state.selectedLocationId])

  function handleRemoveAssignment(staffId: string) {
    if (!selectedDaySchedule) return
    dispatch({ type: "REMOVE_ASSIGNMENT", scheduleId: selectedDaySchedule.id, staffId })
    setSelectedDaySchedule(prev => prev ? {
      ...prev,
      assignments: prev.assignments.filter(a => a.staffId !== staffId),
    } : null)
    toast.success("Staff member removed from shift")
  }

  function handleAddAssignment() {
    if (!selectedDaySchedule) return
    const pool = availableToAdd.filter(s => s.role === addStaffRole || (addStaffRole === "Guide" && s.role === "Guide"))
    if (pool.length === 0) {
      toast.error(`No available ${addStaffRole} staff for this day`)
      return
    }
    const pick = pool[0]
    const newAssignment: StaffAssignment = {
      staffId: pick.id,
      role: addStaffRole,
      shiftStart: "08:00",
      shiftEnd: "17:00",
    }
    dispatch({ type: "ADD_ASSIGNMENT", scheduleId: selectedDaySchedule.id, assignment: newAssignment })
    setSelectedDaySchedule(prev => prev ? {
      ...prev,
      assignments: [...prev.assignments, newAssignment],
    } : null)
    setAddStaffDialog(false)
    toast.success(`${pick.name} added as ${addStaffRole}`)
  }

  function handlePublish(scheduleId: string) {
    dispatch({ type: "UPDATE_STAFF_SCHEDULE", id: scheduleId, updates: { status: "Published" } })
    toast.success("Schedule published and staff notified")
  }

  function handlePublishAll() {
    weekSchedules.forEach(w => {
      if (w.schedule && w.schedule.status === "Draft") {
        dispatch({ type: "UPDATE_STAFF_SCHEDULE", id: w.schedule.id, updates: { status: "Published" } })
      }
    })
    toast.success("All draft schedules published for the week")
  }

  function getStaffName(staffId: string) {
    return allStaff.find(s => s.id === staffId)?.name ?? "Unknown"
  }

  // Calculate needs for a given schedule
  function getNeeds(schedule: DailyStaffSchedule) {
    const daySlots = timeSlots.filter(s => s.date === schedule.date && s.locationId === state.selectedLocationId)
    return calculateStaffNeeds(daySlots, { isWeekend: schedule.isWeekend, isHoliday: schedule.isHoliday })
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Staffing</h1>
          <p className="text-muted-foreground">
            Auto-allocated daily schedules based on bookings and peak demand (closed Tuesdays)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={regenerateSchedules}>
            <RefreshCw className="mr-2 h-4 w-4" />Re-generate
          </Button>
          <Button onClick={handlePublishAll}>Publish All Drafts</Button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid gap-4 md:grid-cols-4">
        <KPIStatCard label="Operating Days" value={weekStats.operatingDays} trendValue="this week" icon={<CalendarClock className="h-4 w-4" />} />
        <KPIStatCard label="Total Staff Shifts" value={weekStats.totalStaffShifts} trendValue={`avg ${weekStats.avgStaff}/day`} icon={<Users className="h-4 w-4" />} />
        <KPIStatCard label="Expected Guests" value={weekStats.totalGuests} trendValue="across all slots" icon={<Sun className="h-4 w-4" />} />
        <KPIStatCard
          label="Understaffed Days"
          value={weekStats.understaffedDays}
          trend={weekStats.understaffedDays > 0 ? "down" : "flat"}
          trendValue={weekStats.understaffedDays > 0 ? "needs attention" : "fully staffed"}
          icon={<AlertTriangle className="h-4 w-4" />}
          className={weekStats.understaffedDays > 0 ? "border-destructive/50" : ""}
        />
      </div>

      {/* Week Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w - 1)}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold">
          {format(weekDates[0], "MMM d")} - {format(weekDates[6], "MMM d, yyyy")}
        </span>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w + 1)}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        {weekOffset !== 0 && (
          <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>This Week</Button>
        )}
      </div>

      <Tabs defaultValue="grid">
        <TabsList>
          <TabsTrigger value="grid">Week Grid</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
          <TabsTrigger value="vacation">Vacation</TabsTrigger>
        </TabsList>

        {/* ===== WEEK GRID VIEW ===== */}
        <TabsContent value="grid" className="mt-4">
          <div className="grid grid-cols-7 gap-2">
            {weekSchedules.map(({ date, dateStr, isOperating, schedule }) => {
              const dayName = format(date, "EEE")
              const dayNum = format(date, "d")
              const isToday = dateStr === stableTodayStr

              if (!isOperating) {
                return (
                  <Card key={dateStr} className="min-h-[240px] opacity-50">
                    <CardContent className="flex flex-col items-center justify-center h-full p-3">
                      <p className="text-xs text-muted-foreground">{dayName}</p>
                      <p className="text-lg font-bold">{dayNum}</p>
                      <Snowflake className="mt-3 h-5 w-5 text-muted-foreground" />
                      <p className="mt-1 text-xs text-muted-foreground">Closed</p>
                    </CardContent>
                  </Card>
                )
              }

              if (!schedule) return null

              const needs = getNeeds(schedule)
              const totalNeeded = needs.reduce((s, n) => s + n.count, 0)
              const isUnder = schedule.assignments.length < totalNeeded

              return (
                <Card
                  key={dateStr}
                  className={`min-h-[240px] cursor-pointer transition-colors hover:bg-muted/50 ${
                    isToday ? "ring-2 ring-primary" : ""
                  } ${isUnder ? "border-destructive/50" : ""}`}
                  onClick={() => setSelectedDaySchedule(schedule)}
                >
                  <CardContent className="p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="text-center">
                        <p className="text-xs text-muted-foreground">{dayName}</p>
                        <p className="text-lg font-bold">{dayNum}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {schedule.isWeekend && (
                          <Badge variant="secondary" className="text-[10px]">Weekend</Badge>
                        )}
                        {schedule.isHoliday && (
                          <Badge variant="destructive" className="text-[10px]">{schedule.holidayName}</Badge>
                        )}
                        <Badge variant={schedule.status === "Published" ? "default" : "outline"} className="text-[10px]">
                          {schedule.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Staff count */}
                    <div className="mb-2 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Staff</span>
                      <span className={`font-semibold ${isUnder ? "text-destructive" : ""}`}>
                        {schedule.assignments.length}/{totalNeeded}
                      </span>
                    </div>

                    {/* Guests / slots */}
                    <div className="mb-3 flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Guests</span>
                      <span className="font-semibold">{schedule.totalGuests}</span>
                    </div>

                    {/* Staff breakdown by role */}
                    <div className="flex flex-col gap-1">
                      {needs.map(need => {
                        const assigned = schedule.assignments.filter(a => a.role === need.role).length
                        return (
                          <div key={need.role} className="flex items-center justify-between text-[11px]">
                            <div className="flex items-center gap-1">
                              {ROLE_ICONS[need.role]}
                              <span className="truncate">{need.role.replace("Check-in Attendant", "Check-in")}</span>
                            </div>
                            <span className={`font-mono ${assigned < need.count ? "text-destructive font-bold" : ""}`}>
                              {assigned}/{need.count}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* ===== LIST VIEW ===== */}
        <TabsContent value="list" className="mt-4">
          <div className="flex flex-col gap-3">
            {weekSchedules
              .filter(w => w.isOperating && w.schedule)
              .map(({ date, dateStr, schedule }) => {
                if (!schedule) return null
                const needs = getNeeds(schedule)
                const totalNeeded = needs.reduce((s, n) => s + n.count, 0)
                const isUnder = schedule.assignments.length < totalNeeded

                return (
                  <Card
                    key={dateStr}
                    className={`cursor-pointer transition-colors hover:bg-muted/50 ${isUnder ? "border-destructive/50" : ""}`}
                    onClick={() => setSelectedDaySchedule(schedule)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      {/* Date */}
                      <div className="w-20 text-center">
                        <p className="text-xs text-muted-foreground">{format(date, "EEE")}</p>
                        <p className="text-xl font-bold">{format(date, "d")}</p>
                        <p className="text-[10px] text-muted-foreground">{format(date, "MMM")}</p>
                      </div>

                      {/* Badges */}
                      <div className="flex flex-wrap items-center gap-2">
                        {schedule.isWeekend && <Badge variant="secondary" className="text-xs">Weekend</Badge>}
                        {schedule.isHoliday && <Badge variant="destructive" className="text-xs">{schedule.holidayName}</Badge>}
                        <Badge variant={schedule.status === "Published" ? "default" : "outline"} className="text-xs">
                          {schedule.status}
                        </Badge>
                      </div>

                      {/* Staff grid */}
                      <div className="flex flex-1 flex-wrap items-center gap-2">
                        {schedule.assignments.map(a => (
                          <div key={a.staffId} className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs ${ROLE_COLORS[a.role]}`}>
                            {ROLE_ICONS[a.role]}
                            <span>{getStaffName(a.staffId).split(" ")[0]}</span>
                          </div>
                        ))}
                      </div>

                      {/* Stats */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <p className={`font-bold ${isUnder ? "text-destructive" : ""}`}>{schedule.assignments.length}/{totalNeeded}</p>
                          <p className="text-[10px] text-muted-foreground">Staff</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold">{schedule.totalGuests}</p>
                          <p className="text-[10px] text-muted-foreground">Guests</p>
                        </div>
                        <div className="text-center">
                          <p className="font-bold">{schedule.peakSlotGuests}</p>
                          <p className="text-[10px] text-muted-foreground">Peak</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
          </div>
        </TabsContent>
        {/* ===== VACATION TAB ===== */}
        <TabsContent value="vacation" className="mt-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold">Vacation & Time Off</h3>
                <VacationRequestButton />
              </div>
              <div className="flex flex-col gap-3">
                {/* Sample vacation entries - in production these would come from the database */}
                {[
                  { staffId: "staff-3", name: "Jordan Lee", dates: "Feb 20-22, 2026", status: "Approved", type: "Vacation" },
                  { staffId: "staff-5", name: "Mia Chen", dates: "Mar 1-5, 2026", status: "Pending", type: "Vacation" },
                  { staffId: "staff-7", name: "Sam Patel", dates: "Mar 10, 2026", status: "Approved", type: "Personal Day" },
                  { staffId: "staff-2", name: "Alex Rivera", dates: "Apr 5-12, 2026", status: "Pending", type: "Vacation" },
                ].map((v, i) => (
                  <div key={i} className="flex items-center justify-between rounded-md border p-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                        {v.name.split(" ").map(n => n[0]).join("")}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{v.name}</p>
                        <p className="text-xs text-muted-foreground">{v.dates} - {v.type}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={v.status === "Approved" ? "Active" : "Pending"} />
                      {v.status === "Pending" && (
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                          toast.info("Manager code required to approve vacation. Use '1234' for demo.")
                        }}>
                          Approve
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted-foreground">
                Staff assigned to work on approved vacation days will be flagged and cannot be assigned.
                Only managers can approve vacation requests.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ===== DAY DETAIL SHEET ===== */}
      <Sheet open={!!selectedDaySchedule} onOpenChange={open => { if (!open) setSelectedDaySchedule(null) }}>
        <SheetContent className="w-[420px] sm:w-[560px] overflow-y-auto">
          {selectedDaySchedule && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {format(new Date(selectedDaySchedule.date + "T12:00:00"), "EEEE, MMMM d")}
                  <Badge variant={selectedDaySchedule.status === "Published" ? "default" : "outline"}>
                    {selectedDaySchedule.status}
                  </Badge>
                </SheetTitle>
                <SheetDescription>
                  {selectedDaySchedule.totalGuests} guests across {selectedDaySchedule.totalSlots} active slots
                  {selectedDaySchedule.isWeekend && " (Weekend)"}
                  {selectedDaySchedule.isHoliday && ` (${selectedDaySchedule.holidayName})`}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-6">
                {/* Role requirements vs actual */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Staffing Requirements</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {getNeeds(selectedDaySchedule).map(need => {
                      const assigned = selectedDaySchedule.assignments.filter(a => a.role === need.role).length
                      const isMet = assigned >= need.count
                      return (
                        <Card key={need.role} className={!isMet ? "border-destructive/50" : ""}>
                          <CardContent className="flex items-center justify-between p-3">
                            <div className="flex items-center gap-2">
                              <div className={`flex h-7 w-7 items-center justify-center rounded-md border ${ROLE_COLORS[need.role]}`}>
                                {ROLE_ICONS[need.role]}
                              </div>
                              <div>
                                <p className="text-xs font-medium">{need.role}</p>
                                <p className="text-[10px] text-muted-foreground">
                                  {assigned}/{need.count} assigned
                                </p>
                              </div>
                            </div>
                            {isMet ? (
                              <Check className="h-4 w-4 text-chart-2" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-destructive" />
                            )}
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
                </div>

                {/* Assigned Staff List */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Assigned Staff ({selectedDaySchedule.assignments.length})</h3>
                    <Button size="sm" variant="outline" onClick={() => setAddStaffDialog(true)}>
                      <UserPlus className="mr-1 h-3 w-3" />Add
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {selectedDaySchedule.assignments.map(assignment => {
                      const member = allStaff.find(s => s.id === assignment.staffId)
                      return (
                        <div key={assignment.staffId} className="flex items-center justify-between rounded-md border p-2.5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                              {member?.name.split(" ").map(n => n[0]).join("") ?? "??"}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{member?.name ?? "Unknown"}</p>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Badge variant="outline" className={`text-[10px] ${ROLE_COLORS[assignment.role]}`}>
                                  {assignment.role}
                                </Badge>
                                <span className="font-mono">{assignment.shiftStart} - {assignment.shiftEnd}</span>
                              </div>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemoveAssignment(assignment.staffId)}
                          >
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )
                    })}
                    {selectedDaySchedule.assignments.length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">No staff assigned yet</p>
                    )}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Notes</h3>
                  <Textarea
                    placeholder="Add scheduling notes..."
                    value={selectedDaySchedule.notes}
                    onChange={(e) => {
                      const newNotes = e.target.value
                      dispatch({ type: "UPDATE_STAFF_SCHEDULE", id: selectedDaySchedule.id, updates: { notes: newNotes } })
                      setSelectedDaySchedule(prev => prev ? { ...prev, notes: newNotes } : null)
                    }}
                    rows={3}
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {selectedDaySchedule.status === "Draft" && (
                    <Button onClick={() => {
                      handlePublish(selectedDaySchedule.id)
                      setSelectedDaySchedule(prev => prev ? { ...prev, status: "Published" } : null)
                    }}>
                      <Check className="mr-2 h-4 w-4" />Publish Schedule
                    </Button>
                  )}
                  <Button variant="outline" onClick={() => {
                    const dateObj = new Date(selectedDaySchedule.date + "T12:00:00")
                    const daySlots = timeSlots.filter(
                      s => s.date === selectedDaySchedule.date && s.locationId === state.selectedLocationId
                    )
                    const fresh = autoAllocate(dateObj, state.selectedLocationId, allStaff, daySlots)
                    dispatch({ type: "UPDATE_STAFF_SCHEDULE", id: selectedDaySchedule.id, updates: { assignments: fresh.assignments } })
                    setSelectedDaySchedule(prev => prev ? { ...prev, assignments: fresh.assignments } : null)
                    toast.success("Day re-generated with auto-allocation")
                  }}>
                    <RefreshCw className="mr-2 h-4 w-4" />Re-generate Day
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ===== ADD STAFF DIALOG ===== */}
      <Dialog open={addStaffDialog} onOpenChange={setAddStaffDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Staff to Shift</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Role</label>
              <Select value={addStaffRole} onValueChange={(v) => setAddStaffRole(v as StaffRole)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Lead Guide">Lead Guide</SelectItem>
                  <SelectItem value="Guide">Guide</SelectItem>
                  <SelectItem value="Ground Crew">Ground Crew</SelectItem>
                  <SelectItem value="Check-in Attendant">Check-in Attendant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Available for this day</p>
              <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
                {availableToAdd
                  .filter(s => s.role === addStaffRole)
                  .map(s => (
                    <div key={s.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                      <span>{s.name}</span>
                      <Badge variant="outline" className="text-[10px]">{s.role}</Badge>
                    </div>
                  ))}
                {availableToAdd.filter(s => s.role === addStaffRole).length === 0 && (
                  <p className="py-2 text-center text-sm text-muted-foreground">
                    No available {addStaffRole} staff for this day
                  </p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddStaffDialog(false)}>Cancel</Button>
            <Button onClick={handleAddAssignment} disabled={availableToAdd.filter(s => s.role === addStaffRole).length === 0}>
              Add to Shift
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function VacationRequestButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        <CalendarClock className="mr-1 h-3 w-3" />New Vacation Request
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>New Vacation Request</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Staff Member</label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                <SelectContent>
                  {allStaff.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Start Date</label>
                <Input type="date" />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">End Date</label>
                <Input type="date" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Type</label>
              <Select defaultValue="vacation">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vacation">Vacation</SelectItem>
                  <SelectItem value="personal">Personal Day</SelectItem>
                  <SelectItem value="sick">Sick Leave</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Notes</label>
              <Textarea placeholder="Optional notes..." rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={() => { setOpen(false); toast.success("Vacation request submitted. Manager approval required.") }}>
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
