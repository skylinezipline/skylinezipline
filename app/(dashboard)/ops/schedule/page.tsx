"use client"

import { useState, useMemo, useCallback } from "react"
import { format, addDays, startOfMonth, endOfMonth, eachDayOfInterval, startOfWeek, endOfWeek, isSameDay, isSameMonth } from "date-fns"
import {
  ChevronLeft, ChevronRight, UserPlus, Send, UserCheck, Ban,
  CalendarDays, Users as UsersIcon, ClipboardList, Download, AlertTriangle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { StatusBadge } from "@/components/status-badge"
import { WaiverStatusBar } from "@/components/waiver-status-bar"
import { useAppStore } from "@/lib/mock-store"
import { timeSlots, staff } from "@/lib/mock-data"
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { toast } from "sonner"

export default function SchedulePage() {
  const { state, dispatch } = useAppStore()
  const [activeTab, setActiveTab] = useState("day")
  const [dateOffset, setDateOffset] = useState(0)
  const baseDate = useMemo(() => new Date("2026-02-14T12:00:00"), [])
  const selectedDate = addDays(baseDate, dateOffset)
  const dateStr = format(selectedDate, "yyyy-MM-dd")
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null)
  const [calendarOpen, setCalendarOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(baseDate)

  // Weight check-in flow
  const [checkInGuestId, setCheckInGuestId] = useState<string | null>(null)
  const [checkInBookingId, setCheckInBookingId] = useState<string | null>(null)
  const [weightInput, setWeightInput] = useState("")
  const [bulkCheckInQueue, setBulkCheckInQueue] = useState<{ bookingId: string; guestId: string; name: string; waiverStatus: string }[]>([])
  const [bulkCheckInIdx, setBulkCheckInIdx] = useState(0)

  // Blocked slots
  const [blockedSlots, setBlockedSlots] = useState<Set<string>>(new Set())

  // Guest detail
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null)

  // Add guest dialog
  const [addGuestOpen, setAddGuestOpen] = useState(false)
  const [newGuestName, setNewGuestName] = useState("")
  const [newGuestEmail, setNewGuestEmail] = useState("")
  const [newGuestPhone, setNewGuestPhone] = useState("")

  // Assign staff dialog
  const [assignStaffOpen, setAssignStaffOpen] = useState(false)
  const [selectedStaffIds, setSelectedStaffIds] = useState<Set<string>>(new Set())
  const [confirmNoLead, setConfirmNoLead] = useState(false)

  // Staff on duty popover
  const [staffPopoverOpen, setStaffPopoverOpen] = useState(false)

  // Staff schedule week offset
  const [weekOffset, setWeekOffset] = useState(0)

  // Staff tour detail popover
  const [staffTourDetailId, setStaffTourDetailId] = useState<string | null>(null)
  const [staffTourDayStr, setStaffTourDayStr] = useState<string | null>(null)

  const daySlots = useMemo(
    () => timeSlots
      .filter(s => s.date === dateStr && s.locationId === state.selectedLocationId)
      .sort((a, b) => a.time.localeCompare(b.time)),
    [dateStr, state.selectedLocationId]
  )

  // Dynamic tour status calculation based on actual bookings
  const getSlotStatus = (slot: typeof timeSlots[0]) => {
    const sBookings = state.bookings.filter(b => b.slotId === slot.id && b.status !== "Cancelled")
    const guestCount = sBookings.reduce((sum, b) => sum + b.guests.length, 0)
    const ratio = guestCount / slot.capacity
    if (ratio >= 1) return "Full"
    if (ratio > 0.5) return "Filling"
    return "Open"
  }

  // Calendar data
  const monthStart = startOfMonth(calendarMonth)
  const monthEnd = endOfMonth(calendarMonth)
  const calStart = startOfWeek(monthStart)
  const calEnd = endOfWeek(monthEnd)
  const calDays = eachDayOfInterval({ start: calStart, end: calEnd })

  // 28-day view
  const monthDays = Array.from({ length: 28 }, (_, i) => {
    const d = addDays(baseDate, i)
    return { date: format(d, "yyyy-MM-dd"), dayDate: d }
  })

  const selectedSlot = daySlots.find(s => s.id === selectedSlotId)
  const slotBookings = selectedSlot
    ? state.bookings.filter(b => b.slotId === selectedSlot.id && b.status !== "Cancelled")
    : []
  const slotGuests = slotBookings.flatMap(b => b.guests.map(g => ({ ...g, bookingId: b.id, contactName: b.contactName })))
  const assignedStaff = selectedSlot
    ? selectedSlot.assignedStaffIds.map(id => staff.find(s => s.id === id)).filter(Boolean)
    : []

  const locationStaff = staff.filter(s => s.locationId === state.selectedLocationId)

  // Calendar day click -> switches to Day View
  const handleCalendarDayClick = (day: Date) => {
    const baseDateOnly = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate())
    const diffTime = day.getTime() - baseDateOnly.getTime()
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
    setDateOffset(diffDays)
    setCalendarOpen(false)
    setActiveTab("day")
  }

  // Check-in with weight - block if waiver not signed
  const handleWeightCheckIn = useCallback(() => {
    const w = parseFloat(weightInput)
    if (!w || w < 30 || w > 400) {
      toast.error("Please enter a valid weight (30-400 lbs)")
      return
    }
    if (bulkCheckInQueue.length > 0) {
      const current = bulkCheckInQueue[bulkCheckInIdx]
      if (current.waiverStatus !== "Signed" && current.waiverStatus !== "Covered") {
        toast.error(`${current.name}'s waiver has not been signed. Cannot check in.`)
        if (bulkCheckInIdx < bulkCheckInQueue.length - 1) {
          setBulkCheckInIdx(i => i + 1)
          setWeightInput("")
        } else {
          setBulkCheckInQueue([])
          setBulkCheckInIdx(0)
          setWeightInput("")
        }
        return
      }
      dispatch({ type: "CHECK_IN_GUEST", bookingId: current.bookingId, guestId: current.guestId, weight: w })
      toast.success(`${current.name} checked in at ${w} lbs`)
      if (bulkCheckInIdx < bulkCheckInQueue.length - 1) {
        setBulkCheckInIdx(i => i + 1)
        setWeightInput("")
      } else {
        setBulkCheckInQueue([])
        setBulkCheckInIdx(0)
        setWeightInput("")
      }
    } else if (checkInGuestId && checkInBookingId) {
      const guest = slotGuests.find(g => g.id === checkInGuestId)
      if (guest && guest.waiverStatus !== "Signed" && guest.waiverStatus !== "Covered") {
        toast.error("Waiver has not been signed. Cannot check in this guest.")
        setCheckInGuestId(null)
        setCheckInBookingId(null)
        setWeightInput("")
        return
      }
      dispatch({ type: "CHECK_IN_GUEST", bookingId: checkInBookingId, guestId: checkInGuestId, weight: w })
      toast.success("Guest checked in")
      setCheckInGuestId(null)
      setCheckInBookingId(null)
      setWeightInput("")
    }
  }, [weightInput, bulkCheckInQueue, bulkCheckInIdx, checkInGuestId, checkInBookingId, dispatch, slotGuests])

  // Bulk check-in - only signed waivers
  const handleBulkCheckInAll = () => {
    const eligible = slotGuests.filter(g => !g.checkedIn && (g.waiverStatus === "Signed" || g.waiverStatus === "Covered"))
    const unsigned = slotGuests.filter(g => !g.checkedIn && g.waiverStatus !== "Signed" && g.waiverStatus !== "Covered")
    if (eligible.length === 0) {
      toast.error(unsigned.length > 0
        ? `${unsigned.length} guest(s) cannot be checked in - waivers not signed`
        : "All guests already checked in")
      return
    }
    setBulkCheckInQueue(eligible.map(g => ({ bookingId: g.bookingId, guestId: g.id, name: g.name, waiverStatus: g.waiverStatus })))
    setBulkCheckInIdx(0)
    setWeightInput("")
    if (unsigned.length > 0) toast.info(`${unsigned.length} guest(s) skipped - waiver not signed`)
  }

  const handleBlockSlot = (slotId: string) => {
    setBlockedSlots(prev => {
      const next = new Set(prev)
      if (next.has(slotId)) { next.delete(slotId); toast.success("Tour time unblocked") }
      else { next.add(slotId); toast.success("Tour time blocked") }
      return next
    })
  }

  const selectedGuestData = selectedGuestId ? slotGuests.find(g => g.id === selectedGuestId) : null

  // Staff schedule week
  const weekStart = addDays(startOfWeek(baseDate, { weekStartsOn: 1 }), weekOffset * 7)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const staffRoleColors: Record<string, string> = {
    "Lead Guide": "bg-primary/20 text-primary",
    "Guide": "bg-chart-2/20 text-chart-2",
    "Ground Crew": "bg-chart-3/20 text-chart-3",
    "Check-in Attendant": "bg-accent/20 text-accent",
    "Manager": "bg-chart-5/20 text-chart-5",
    "Admin": "bg-muted text-muted-foreground",
  }

  // Add guest to tour manually
  const handleAddGuestToTour = () => {
    if (!selectedSlot || !newGuestName.trim()) return
    const firstBooking = slotBookings[0]
    if (!firstBooking) {
      toast.error("No booking found for this slot to add a guest to")
      return
    }
    const hasEmail = newGuestEmail.trim().length > 0
    dispatch({
      type: "UPDATE_BOOKING",
      id: firstBooking.id,
      updates: {
        guests: [...firstBooking.guests, {
          id: `guest-${Date.now()}`,
          bookingId: firstBooking.id,
          name: newGuestName.trim(),
          age: 0,
          isMinor: false,
          waiverStatus: "Outstanding" as const,
          checkedIn: false,
          email: newGuestEmail.trim() || undefined,
          phone: newGuestPhone.trim() || undefined,
        }],
        partySize: firstBooking.partySize + 1,
      },
    })
    if (hasEmail) {
      toast.success(`${newGuestName.trim()} added. Waiver will be sent to ${newGuestEmail.trim()}.`)
    } else {
      toast.success(`${newGuestName.trim()} added to tour.`)
    }
    setNewGuestName("")
    setNewGuestEmail("")
    setNewGuestPhone("")
    setAddGuestOpen(false)
  }

  // Assign staff dialog logic
  const handleOpenAssignStaff = () => {
    if (!selectedSlot) return
    setSelectedStaffIds(new Set(selectedSlot.assignedStaffIds))
    setAssignStaffOpen(true)
  }

  const handleConfirmAssignStaff = () => {
    const hasLeadGuide = Array.from(selectedStaffIds).some(id => {
      const s = staff.find(st => st.id === id)
      return s?.role === "Lead Guide"
    })
    if (!hasLeadGuide && !confirmNoLead) {
      setConfirmNoLead(true)
      return
    }
    toast.success(`Staff updated for ${selectedSlot?.time} departure`)
    setAssignStaffOpen(false)
    setConfirmNoLead(false)
  }

  // Export staff schedule stub
  const handleExportSchedule = () => {
    toast.success("Staff schedule exported (PDF download would start)")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">Manage departures, staff, and check-ins</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="day">Day View</TabsTrigger>
          <TabsTrigger value="month">Month View</TabsTrigger>
          <TabsTrigger value="staff">Staff Schedule</TabsTrigger>
        </TabsList>

        {/* DAY VIEW */}
        <TabsContent value="day" className="mt-4">
          <div className="mb-4 flex items-center gap-3">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setDateOffset(d => d - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <button
              className="flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm font-semibold hover:bg-muted transition-colors"
              onClick={() => { setCalendarMonth(selectedDate); setCalendarOpen(true) }}
            >
              <CalendarDays className="h-4 w-4 text-muted-foreground" />
              {format(selectedDate, "EEEE, MMMM d, yyyy")}
            </button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setDateOffset(d => d + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            {dateOffset !== 0 && (
              <Button variant="ghost" size="sm" onClick={() => setDateOffset(0)}>Today</Button>
            )}
          </div>

          {/* Waiver Legend */}
          <div className="mb-4 flex flex-wrap items-center gap-4 rounded-md border bg-muted/30 px-4 py-2 text-xs">
            <span className="font-medium text-muted-foreground">Waiver Legend:</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />Signed</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-chart-3" />Covered (Minor)</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" />Sent</span>
            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive/40" />Outstanding</span>
          </div>

          {/* Staff on duty with expandable */}
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Staff on duty:</span>
            {locationStaff.slice(0, 6).map(s => (
              <Badge key={s.id} variant="outline" className={`text-[10px] ${staffRoleColors[s.role] || ""}`}>
                {s.name.split(" ")[0]} ({s.role.replace("Check-in Attendant", "Check-in")})
              </Badge>
            ))}
            {locationStaff.length > 6 && (
              <Popover open={staffPopoverOpen} onOpenChange={setStaffPopoverOpen}>
                <PopoverTrigger asChild>
                  <button className="text-xs text-primary font-medium hover:underline cursor-pointer">
                    +{locationStaff.length - 6} more
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-64 p-3">
                  <h4 className="mb-2 text-sm font-semibold">All Staff On Duty ({locationStaff.length})</h4>
                  <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
                    {locationStaff.map(s => (
                      <div key={s.id} className="flex items-center gap-2 text-xs">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${staffRoleColors[s.role] || "bg-muted"}`}>
                          {s.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <span className="font-medium">{s.name}</span>
                        <span className="text-muted-foreground">({s.role})</span>
                      </div>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            )}
          </div>

          <div className="flex flex-col gap-2">
            {daySlots.map(slot => {
              const sBookings = state.bookings.filter(b => b.slotId === slot.id && b.status !== "Cancelled")
              const sGuests = sBookings.flatMap(b => b.guests)
              const sStaff = slot.assignedStaffIds.map(id => staff.find(s => s.id === id)).filter(Boolean)
              const isBlocked = blockedSlots.has(slot.id)
              const dynamicStatus = getSlotStatus(slot)
              return (
                <Card
                  key={slot.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${isBlocked ? "opacity-50 border-destructive/30" : ""}`}
                  onClick={() => !isBlocked && setSelectedSlotId(slot.id)}
                >
                  <CardContent className="flex items-center gap-4 p-3">
                    <div className="w-14 text-center">
                      <p className="text-base font-bold font-mono">{slot.time}</p>
                    </div>
                    <div className="flex flex-1 flex-wrap items-center gap-3">
                      <span className="text-sm font-medium">{sGuests.length}/{slot.capacity}</span>
                      {isBlocked ? (
                        <Badge variant="destructive" className="text-[10px]">Blocked</Badge>
                      ) : (
                        <StatusBadge status={dynamicStatus} />
                      )}
                      <span className="hidden text-xs text-muted-foreground md:inline">
                        {sStaff.map(s => s?.name.split(" ")[0]).join(", ") || "No staff"}
                      </span>
                      {sGuests.length > 0 && <WaiverStatusBar guests={sGuests} className="w-20" />}
                    </div>
                    <div className="hidden gap-1 md:flex">
                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={(e) => { e.stopPropagation(); setSelectedSlotId(slot.id) }}>
                        <UserCheck className="mr-1 h-3 w-3" />Check-in
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* MONTH VIEW - clicking a day switches to Day View */}
        <TabsContent value="month" className="mt-4">
          <div className="grid grid-cols-7 gap-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(d => (
              <div key={d} className="py-1 text-center text-xs font-medium text-muted-foreground">{d}</div>
            ))}
            {monthDays.map(day => {
              const wSlots = timeSlots.filter(s => s.date === day.date && s.locationId === state.selectedLocationId)
              const totalBooked = wSlots.reduce((s, sl) => s + sl.bookedCount, 0)
              const totalCap = wSlots.reduce((s, sl) => s + sl.capacity, 0)
              const fullSlots = wSlots.filter(s => s.status === "Full").length
              const isSelected = day.date === dateStr
              const dBookings = state.bookings.filter(b => b.date === day.date && b.locationId === state.selectedLocationId && b.status !== "Cancelled")
              return (
                <Card
                  key={day.date}
                  className={`min-h-[120px] cursor-pointer transition-colors hover:bg-muted/50 ${isSelected ? "ring-2 ring-primary" : ""}`}
                  onClick={() => handleCalendarDayClick(day.dayDate)}
                >
                  <CardContent className="p-2">
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">{format(day.dayDate, "EEE")}</p>
                      <p className={`text-sm font-bold ${isSameDay(day.dayDate, baseDate) ? "text-primary" : ""}`}>
                        {format(day.dayDate, "d")}
                      </p>
                    </div>
                    <div className="flex flex-col gap-0.5 text-xs">
                      <div className="flex justify-between"><span className="text-muted-foreground">Guests</span><span className="font-medium">{totalBooked}</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground">Bookings</span><span className="font-medium">{dBookings.length}</span></div>
                      {fullSlots > 0 && <Badge variant="destructive" className="mt-1 w-fit text-[9px] px-1 py-0">{fullSlots} full</Badge>}
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${totalCap > 0 ? (totalBooked / totalCap) * 100 : 0}%` }} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>

        {/* STAFF SCHEDULE VIEW with week arrows, export, clickable tours */}
        <TabsContent value="staff" className="mt-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <CardTitle className="text-base">
                    Staff Schedule - {format(weekDays[0], "MMM d")} to {format(weekDays[6], "MMM d, yyyy")}
                  </CardTitle>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setWeekOffset(w => w + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  {weekOffset !== 0 && (
                    <Button variant="ghost" size="sm" onClick={() => setWeekOffset(0)}>This Week</Button>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={handleExportSchedule}>
                  <Download className="mr-1 h-3 w-3" />Export
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="py-2 pr-4 text-left font-medium text-muted-foreground w-40">Staff Member</th>
                      {weekDays.map(d => (
                        <th key={d.toISOString()} className="min-w-[100px] py-2 text-center font-medium text-muted-foreground">
                          <div>{format(d, "EEE")}</div>
                          <div className="text-xs">{format(d, "MMM d")}</div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {locationStaff.map(member => (
                      <tr key={member.id}>
                        <td className="py-2 pr-4">
                          <div className="flex items-center gap-2">
                            <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${staffRoleColors[member.role] || "bg-muted"}`}>
                              {member.name.split(" ").map(n => n[0]).join("")}
                            </div>
                            <div>
                              <p className="font-medium text-xs">{member.name}</p>
                              <p className="text-[10px] text-muted-foreground">{member.role}</p>
                            </div>
                          </div>
                        </td>
                        {weekDays.map(d => {
                          const dayName = format(d, "EEE") as "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"
                          const isAvailable = !member.availability || member.availability.includes(dayName)
                          const dayStr2 = format(d, "yyyy-MM-dd")
                          const assignedSlots = timeSlots.filter(
                            s => s.date === dayStr2 && s.locationId === state.selectedLocationId && s.assignedStaffIds.includes(member.id)
                          )
                          return (
                            <td key={d.toISOString()} className="py-2 text-center">
                              {isAvailable ? (
                                assignedSlots.length > 0 ? (
                                  <Popover
                                    open={staffTourDetailId === member.id && staffTourDayStr === dayStr2}
                                    onOpenChange={(open) => {
                                      if (open) { setStaffTourDetailId(member.id); setStaffTourDayStr(dayStr2) }
                                      else { setStaffTourDetailId(null); setStaffTourDayStr(null) }
                                    }}
                                  >
                                    <PopoverTrigger asChild>
                                      <button className={`mx-auto flex h-8 w-full items-center justify-center rounded text-xs font-medium cursor-pointer hover:opacity-80 ${staffRoleColors[member.role] || "bg-primary/10 text-primary"}`}>
                                        {assignedSlots.length} tours
                                      </button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-48 p-2">
                                      <h4 className="mb-1 text-xs font-semibold">{member.name} - {format(d, "MMM d")}</h4>
                                      <div className="flex flex-col gap-1">
                                        {assignedSlots.map(sl => (
                                          <div key={sl.id} className="flex items-center justify-between rounded bg-muted/50 px-2 py-1 text-xs">
                                            <span className="font-mono font-medium">{sl.time}</span>
                                            <span className="text-muted-foreground">{sl.bookedCount}/{sl.capacity}</span>
                                          </div>
                                        ))}
                                      </div>
                                    </PopoverContent>
                                  </Popover>
                                ) : (
                                  <div className="mx-auto flex h-8 w-full items-center justify-center rounded bg-muted/50 text-xs text-muted-foreground">
                                    Available
                                  </div>
                                )
                              ) : (
                                <div className="mx-auto flex h-8 w-full items-center justify-center rounded bg-muted/30 text-xs text-muted-foreground/50">
                                  Off
                                </div>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Calendar Picker Dialog */}
      <Dialog open={calendarOpen} onOpenChange={setCalendarOpen}>
        <DialogContent className="sm:max-w-[350px]">
          <DialogHeader><DialogTitle>Select Date</DialogTitle></DialogHeader>
          <div>
            <div className="mb-3 flex items-center justify-between">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCalendarMonth(d => addDays(startOfMonth(d), -1))}><ChevronLeft className="h-4 w-4" /></Button>
              <span className="text-sm font-semibold">{format(calendarMonth, "MMMM yyyy")}</span>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCalendarMonth(d => addDays(endOfMonth(d), 1))}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                <div key={d} className="py-1 text-[10px] font-medium text-muted-foreground">{d}</div>
              ))}
              {calDays.map(day => {
                const isCurrentMonth = isSameMonth(day, calendarMonth)
                const isSelected = isSameDay(day, selectedDate)
                const isBaseDateDay = isSameDay(day, baseDate)
                return (
                  <button
                    key={day.toISOString()}
                    className={`rounded-md p-1.5 text-xs transition-colors ${
                      isSelected ? "bg-primary text-primary-foreground" :
                      isBaseDateDay ? "bg-primary/10 text-primary font-bold" :
                      isCurrentMonth ? "hover:bg-muted" : "text-muted-foreground/40"
                    }`}
                    onClick={() => handleCalendarDayClick(day)}
                  >
                    {format(day, "d")}
                  </button>
                )
              })}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Weight Check-In Dialog */}
      <Dialog
        open={!!checkInGuestId || bulkCheckInQueue.length > 0}
        onOpenChange={(open) => {
          if (!open) { setCheckInGuestId(null); setCheckInBookingId(null); setBulkCheckInQueue([]); setBulkCheckInIdx(0); setWeightInput("") }
        }}
      >
        <DialogContent className="sm:max-w-[360px]">
          <DialogHeader>
            <DialogTitle>
              {bulkCheckInQueue.length > 0
                ? `Check-In: ${bulkCheckInQueue[bulkCheckInIdx]?.name} (${bulkCheckInIdx + 1}/${bulkCheckInQueue.length})`
                : "Enter Guest Weight"
              }
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input id="weight" type="number" placeholder="Enter weight in lbs" value={weightInput} onChange={e => setWeightInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleWeightCheckIn() }} autoFocus />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleWeightCheckIn}>
              {bulkCheckInQueue.length > 0 && bulkCheckInIdx < bulkCheckInQueue.length - 1 ? "Next Guest" : "Check In"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Guest to Tour Dialog */}
      <Dialog open={addGuestOpen} onOpenChange={setAddGuestOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Add Guest to Tour</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Name</Label>
              <Input placeholder="Guest name" value={newGuestName} onChange={e => setNewGuestName(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <Label>Email (sends waiver)</Label>
                <Input type="email" placeholder="email@example.com" value={newGuestEmail} onChange={e => setNewGuestEmail(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Phone</Label>
                <Input placeholder="(555) 000-0000" value={newGuestPhone} onChange={e => setNewGuestPhone(e.target.value)} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddGuestOpen(false)}>Cancel</Button>
            <Button onClick={handleAddGuestToTour}>Add Guest</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Staff Dialog */}
      <Dialog open={assignStaffOpen} onOpenChange={setAssignStaffOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Assign Staff - {selectedSlot?.time}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto py-2">
            {locationStaff.map(s => (
              <label key={s.id} className="flex items-center gap-3 rounded-md border p-2.5 cursor-pointer hover:bg-muted/50 transition-colors">
                <Checkbox
                  checked={selectedStaffIds.has(s.id)}
                  onCheckedChange={(checked) => {
                    setSelectedStaffIds(prev => {
                      const next = new Set(prev)
                      if (checked) next.add(s.id); else next.delete(s.id)
                      return next
                    })
                  }}
                />
                <div className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold ${staffRoleColors[s.role] || "bg-muted"}`}>
                  {s.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{s.name}</p>
                  <p className="text-[10px] text-muted-foreground">{s.role}</p>
                </div>
              </label>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignStaffOpen(false)}>Cancel</Button>
            <Button onClick={handleConfirmAssignStaff}>Confirm</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* No Lead Guide confirmation */}
      <AlertDialog open={confirmNoLead} onOpenChange={setConfirmNoLead}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-accent" />No Lead Guide Assigned
            </AlertDialogTitle>
            <AlertDialogDescription>
              No Lead Guide has been assigned to this tour. Are you sure you would like to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>No, go back</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              toast.success(`Staff updated for ${selectedSlot?.time} departure`)
              setAssignStaffOpen(false)
              setConfirmNoLead(false)
            }}>
              Yes, I understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Slot Detail Sheet */}
      <Sheet open={!!selectedSlotId} onOpenChange={(open) => { if (!open) { setSelectedSlotId(null); setSelectedGuestId(null) } }}>
        <SheetContent className="w-[420px] sm:w-[580px] overflow-y-auto">
          {selectedSlot && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <span className="font-mono">{selectedSlot.time}</span> Departure
                  <StatusBadge status={blockedSlots.has(selectedSlot.id) ? "Closed" : getSlotStatus(selectedSlot)} />
                </SheetTitle>
                <SheetDescription>
                  {format(selectedDate, "MMMM d, yyyy")} - {slotGuests.length}/{selectedSlot.capacity} guests
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-6">
                {/* Staff */}
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Assigned Staff</h3>
                  {assignedStaff.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No staff assigned</p>
                  ) : (
                    <div className="flex flex-col gap-1">
                      {assignedStaff.map(s => s && (
                        <div key={s.id} className="flex items-center gap-2 text-sm">
                          <div className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${staffRoleColors[s.role] || "bg-muted"}`}>
                            {s.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <span>{s.name}</span>
                          <Badge variant="outline" className={`text-[10px] ${staffRoleColors[s.role] || ""}`}>{s.role}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button size="sm" variant="outline" className="mt-2" onClick={handleOpenAssignStaff}>
                    <UserPlus className="mr-1 h-3 w-3" />Assign Staff
                  </Button>
                </div>

                {/* Guests */}
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Guest List ({slotGuests.length})</h3>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAddGuestOpen(true)}>
                      <UserPlus className="mr-1 h-3 w-3" />Add Guest
                    </Button>
                  </div>
                  {slotGuests.length > 0 && <WaiverStatusBar guests={slotGuests} showLabels className="mb-3" />}
                  <div className="flex flex-col gap-1.5">
                    {slotGuests.map(g => (
                      <div
                        key={g.id}
                        className={`flex items-center justify-between rounded-md border p-2.5 text-sm cursor-pointer hover:bg-muted/50 transition-colors ${selectedGuestId === g.id ? "ring-2 ring-primary" : ""}`}
                        onClick={() => setSelectedGuestId(g.id)}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{g.name}</span>
                            {g.isMinor && <Badge variant="outline" className="text-[10px] border-accent text-accent">Minor</Badge>}
                            {g.checkedIn && <Badge className="bg-primary/15 text-primary border-0 text-[10px]">Checked In</Badge>}
                          </div>
                          <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                            {/* Age only shown if waiver signed (DOB from waiver) */}
                            {(g.waiverStatus === "Signed" || g.waiverStatus === "Covered") && g.age > 0 && <span>Age: {g.age}</span>}
                            {g.weight && <span>Weight: {g.weight} lbs</span>}
                            <span>Booking: {g.contactName}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <StatusBadge status={g.waiverStatus} />
                          {!g.checkedIn && (g.waiverStatus === "Signed" || g.waiverStatus === "Covered") && (
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={(e) => {
                              e.stopPropagation()
                              setCheckInGuestId(g.id); setCheckInBookingId(g.bookingId); setWeightInput("")
                            }}>
                              <UserCheck className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Guest Detail Panel */}
                  {selectedGuestData && (
                    <div className="mt-3 rounded-lg border bg-muted/30 p-3">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-semibold">{selectedGuestData.name}</h4>
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setSelectedGuestId(null)}>Close</Button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {(selectedGuestData.waiverStatus === "Signed" || selectedGuestData.waiverStatus === "Covered") && selectedGuestData.age > 0 && (
                          <div><span className="text-muted-foreground">Age:</span> <span className="font-medium">{selectedGuestData.age}</span></div>
                        )}
                        <div><span className="text-muted-foreground">Weight:</span> <span className="font-medium">{selectedGuestData.weight ? `${selectedGuestData.weight} lbs` : "Not recorded"}</span></div>
                        <div><span className="text-muted-foreground">Waiver:</span> <StatusBadge status={selectedGuestData.waiverStatus} /></div>
                        <div><span className="text-muted-foreground">Checked In:</span> <span className="font-medium">{selectedGuestData.checkedIn ? "Yes" : "No"}</span></div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {/* Resend waiver for Outstanding OR Sent */}
                        {(selectedGuestData.waiverStatus === "Outstanding" || selectedGuestData.waiverStatus === "Sent") && (
                          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => {
                            dispatch({ type: "UPDATE_GUEST_WAIVER", bookingId: selectedGuestData.bookingId, guestId: selectedGuestData.id, status: "Sent" })
                            toast.success(selectedGuestData.waiverStatus === "Sent" ? "Waiver resent" : "Waiver sent")
                          }}>
                            <Send className="mr-1 h-3 w-3" />{selectedGuestData.waiverStatus === "Sent" ? "Resend Waiver" : "Send Waiver"}
                          </Button>
                        )}
                        {!selectedGuestData.checkedIn && (selectedGuestData.waiverStatus === "Signed" || selectedGuestData.waiverStatus === "Covered") && (
                          <Button size="sm" className="h-7 text-xs" onClick={() => {
                            setCheckInGuestId(selectedGuestData.id); setCheckInBookingId(selectedGuestData.bookingId); setWeightInput("")
                          }}>
                            <UserCheck className="mr-1 h-3 w-3" />Check In
                          </Button>
                        )}
                        {!selectedGuestData.checkedIn && selectedGuestData.waiverStatus !== "Signed" && selectedGuestData.waiverStatus !== "Covered" && (
                          <span className="text-xs text-destructive flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />Waiver required for check-in
                          </span>
                        )}
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.info("Note editor would open")}>
                          <ClipboardList className="mr-1 h-3 w-3" />Add Note
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={handleBulkCheckInAll}>
                    <UserCheck className="mr-1 h-3 w-3" />Check-in All
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    // Resend to Outstanding AND Sent
                    const resendable = slotGuests.filter(g => g.waiverStatus === "Outstanding" || g.waiverStatus === "Sent")
                    resendable.forEach(g => {
                      dispatch({ type: "UPDATE_GUEST_WAIVER", bookingId: g.bookingId, guestId: g.id, status: "Sent" })
                    })
                    toast.success(`Waivers sent to ${resendable.length} guest(s)`)
                  }}>
                    <Send className="mr-1 h-3 w-3" />Resend Waivers
                  </Button>
                  <Button size="sm" variant={blockedSlots.has(selectedSlot.id) ? "default" : "destructive"} onClick={() => handleBlockSlot(selectedSlot.id)}>
                    <Ban className="mr-1 h-3 w-3" />{blockedSlots.has(selectedSlot.id) ? "Unblock Tour" : "Block Tour"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
