// ============================================================
// Staffing Auto-Allocation Engine
// ============================================================
// Rules:
// - 6 days/week operation (closed Tuesdays)
// - Min 4 staff/day: 1 Lead Guide, 1 Guide, 1 Ground Crew, 1 Check-in Attendant
// - Guest ratio scaling: +1 Guide per 12 guests, +1 Ground Crew per 20 guests
// - Slot density scaling: if >3 overlapping full slots, +1 Guide
// - Weekends/holidays: +1 Guide and +1 Ground Crew extra
// - Shift covers full operating day (08:00 - 17:00)

import { format, getDay, addDays } from "date-fns"
import type { Staff, DailyStaffSchedule, StaffAssignment, StaffRole, DayOfWeek, TimeSlot } from "./types"

// US Federal Holidays 2026 (simplified)
const HOLIDAYS_2026: Record<string, string> = {
  "2026-01-01": "New Year's Day",
  "2026-01-19": "MLK Day",
  "2026-02-16": "Presidents' Day",
  "2026-05-25": "Memorial Day",
  "2026-07-04": "Independence Day",
  "2026-09-07": "Labor Day",
  "2026-11-26": "Thanksgiving",
  "2026-12-25": "Christmas Day",
}

const DAY_MAP: DayOfWeek[] = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const CLOSED_DAY: DayOfWeek = "Tue" // closed Tuesdays
const SHIFT_START = "08:00"
const SHIFT_END = "17:00"

export function isOperatingDay(date: Date): boolean {
  return DAY_MAP[getDay(date)] !== CLOSED_DAY
}

export function isWeekend(date: Date): boolean {
  const day = getDay(date)
  return day === 0 || day === 6
}

export function isHoliday(dateStr: string): { is: boolean; name?: string } {
  const name = HOLIDAYS_2026[dateStr]
  return name ? { is: true, name } : { is: false }
}

interface StaffRequirement {
  role: StaffRole
  count: number
}

/**
 * Calculate how many staff of each role are needed for a given day
 */
export function calculateStaffNeeds(
  daySlots: TimeSlot[],
  opts: { isWeekend: boolean; isHoliday: boolean }
): StaffRequirement[] {
  const totalGuests = daySlots.reduce((sum, s) => sum + s.bookedCount, 0)
  const activeSlots = daySlots.filter(s => s.bookedCount > 0)
  const peakGuests = activeSlots.length > 0
    ? Math.max(...activeSlots.map(s => s.bookedCount))
    : 0

  // Count overlapping busy slots (>75% capacity)
  const busySlots = daySlots.filter(s => s.bookedCount / s.capacity >= 0.75)

  // Base: 1 Lead Guide, 1 Guide, 1 Ground Crew, 1 Check-in Attendant
  let leadGuides = 1
  let guides = 1
  let groundCrew = 1
  let checkinAttendants = 1

  // Guest ratio scaling
  if (totalGuests > 0) {
    guides += Math.floor(totalGuests / 12)        // +1 guide per 12 total daily guests
    groundCrew += Math.floor(totalGuests / 20)     // +1 ground crew per 20 guests
  }

  // Slot density scaling: if more than 3 busy slots, add a guide
  if (busySlots.length > 3) {
    guides += 1
  }

  // Peak slot scaling: if any single slot has 10+ guests, add ground crew
  if (peakGuests >= 10) {
    groundCrew += 1
  }

  // Weekend / holiday bump
  if (opts.isWeekend || opts.isHoliday) {
    guides += 1
    groundCrew += 1
    // High-volume weekends/holidays may need an extra check-in attendant
    if (totalGuests > 40) {
      checkinAttendants += 1
    }
  }

  return [
    { role: "Lead Guide", count: leadGuides },
    { role: "Guide", count: guides },
    { role: "Ground Crew", count: groundCrew },
    { role: "Check-in Attendant", count: checkinAttendants },
  ]
}

/**
 * Filter staff available for a given day and location
 */
function getAvailableStaff(
  allStaff: Staff[],
  locationId: string,
  date: Date
): Staff[] {
  const dayName = DAY_MAP[getDay(date)]
  return allStaff.filter(s => {
    if (s.locationId !== locationId) return false
    // Managers and Admins don't do operational shifts
    if (s.role === "Manager" || s.role === "Admin") return false
    // Check availability if defined
    if (s.availability && !s.availability.includes(dayName)) return false
    return true
  })
}

/**
 * Auto-allocate staff for a given day at a location
 */
export function autoAllocate(
  date: Date,
  locationId: string,
  allStaff: Staff[],
  daySlots: TimeSlot[]
): DailyStaffSchedule {
  const dateStr = format(date, "yyyy-MM-dd")
  const weekend = isWeekend(date)
  const holiday = isHoliday(dateStr)
  const available = getAvailableStaff(allStaff, locationId, date)

  const needs = calculateStaffNeeds(daySlots, {
    isWeekend: weekend,
    isHoliday: holiday.is,
  })

  const assignments: StaffAssignment[] = []
  const assignedIds = new Set<string>()

  // Allocate by role in priority order
  for (const need of needs) {
    const rolePool = available.filter(
      s => s.role === need.role && !assignedIds.has(s.id)
    )

    const toAssign = Math.min(need.count, rolePool.length)
    for (let i = 0; i < toAssign; i++) {
      assignments.push({
        staffId: rolePool[i].id,
        role: need.role,
        shiftStart: SHIFT_START,
        shiftEnd: SHIFT_END,
      })
      assignedIds.add(rolePool[i].id)
    }

    // If not enough staff in the exact role, try to fill from Guides (cross-trained)
    const deficit = need.count - toAssign
    if (deficit > 0 && need.role !== "Guide") {
      const guideBackfill = available.filter(
        s => s.role === "Guide" && !assignedIds.has(s.id)
      )
      const backfillCount = Math.min(deficit, guideBackfill.length)
      for (let i = 0; i < backfillCount; i++) {
        assignments.push({
          staffId: guideBackfill[i].id,
          role: need.role, // cross-trained: guide filling another role
          shiftStart: SHIFT_START,
          shiftEnd: SHIFT_END,
        })
        assignedIds.add(guideBackfill[i].id)
      }
    }
  }

  const totalGuests = daySlots.reduce((sum, s) => sum + s.bookedCount, 0)
  const activeSlots = daySlots.filter(s => s.bookedCount > 0)
  const peakSlotGuests = activeSlots.length > 0
    ? Math.max(...activeSlots.map(s => s.bookedCount))
    : 0

  return {
    id: `sched-${locationId}-${dateStr}`,
    locationId,
    date: dateStr,
    status: "Draft",
    assignments,
    totalGuests,
    totalSlots: activeSlots.length,
    peakSlotGuests,
    isWeekend: weekend,
    isHoliday: holiday.is,
    holidayName: holiday.name,
    notes: "",
  }
}

/**
 * Generate schedules for a date range
 */
export function generateSchedules(
  startDate: Date,
  days: number,
  locationId: string,
  allStaff: Staff[],
  allSlots: TimeSlot[]
): DailyStaffSchedule[] {
  const schedules: DailyStaffSchedule[] = []

  for (let i = 0; i < days; i++) {
    const date = addDays(startDate, i)
    if (!isOperatingDay(date)) continue

    const dateStr = format(date, "yyyy-MM-dd")
    const daySlots = allSlots.filter(
      s => s.date === dateStr && s.locationId === locationId
    )

    schedules.push(autoAllocate(date, locationId, allStaff, daySlots))
  }

  return schedules
}
