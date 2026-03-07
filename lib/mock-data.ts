import {
  type Location, type Staff, type TimeSlot, type Booking, type BookingGuest,
  type Campaign, type Lead, type NurtureSequence, type NurtureStep,
  type EquipmentItem, type Inspection, type MaintenanceTask,
  type Resource, type Certificate, type FAQItem, type Integration,
  type OpsAlert, type TimelineEvent, type Invoice, type Notification,
  type DailyStaffSchedule, type StaffAssignment, type StaffRole, type DayOfWeek,
  type SiteMedia, type UGCPost, type ScheduledPost,
} from "./types"
import { format, addDays, subDays } from "date-fns"

const today = new Date("2026-02-14T12:00:00")
const todayStr = format(today, "yyyy-MM-dd")

// Deterministic seeded PRNG (mulberry32) to avoid hydration mismatches
function createRng(seed: number) {
  return () => {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rng = createRng(42)

// ============================================================
// LOCATIONS
// ============================================================
export const locations: Location[] = [
  {
    id: "loc-1",
    name: "Skyline Ridge",
    address: "1200 Ridge Crest Trail, Asheville, NC 28801",
    capacity: 12,
    operatingHoursStart: "08:00",
    operatingHoursEnd: "17:00",
    slotInterval: 20,
  },
  {
    id: "loc-2",
    name: "Canyon Creek",
    address: "450 Canyon Road, Gatlinburg, TN 37738",
    capacity: 10,
    operatingHoursStart: "08:00",
    operatingHoursEnd: "17:00",
    slotInterval: 20,
  },
]

// ============================================================
// STAFF
// ============================================================
export const staff: Staff[] = [
  // Skyline Ridge
  { id: "staff-1", name: "Jake Torres", email: "jake@ziplineops.com", role: "Manager", locationId: "loc-1", phone: "(828) 555-0101" },
  { id: "staff-2", name: "Sarah Chen", email: "sarah@ziplineops.com", role: "Lead Guide", locationId: "loc-1", phone: "(828) 555-0102" },
  { id: "staff-3", name: "Marcus Williams", email: "marcus@ziplineops.com", role: "Guide", locationId: "loc-1", phone: "(828) 555-0103" },
  { id: "staff-4", name: "Ava Patel", email: "ava@ziplineops.com", role: "Guide", locationId: "loc-1", phone: "(828) 555-0104" },
  { id: "staff-5", name: "Jordan Rivera", email: "jordan@ziplineops.com", role: "Guide", locationId: "loc-1", phone: "(828) 555-0105" },
  { id: "staff-6", name: "Emma Brooks", email: "emma@ziplineops.com", role: "Admin", locationId: "loc-1", phone: "(828) 555-0106" },
  { id: "staff-13", name: "Carlos Mendez", email: "carlos@ziplineops.com", role: "Ground Crew", locationId: "loc-1", phone: "(828) 555-0107" },
  { id: "staff-14", name: "Tanya Reid", email: "tanya@ziplineops.com", role: "Ground Crew", locationId: "loc-1", phone: "(828) 555-0108" },
  { id: "staff-15", name: "Derek Olsen", email: "derek@ziplineops.com", role: "Check-in Attendant", locationId: "loc-1", phone: "(828) 555-0109" },
  { id: "staff-16", name: "Maya Singh", email: "maya@ziplineops.com", role: "Check-in Attendant", locationId: "loc-1", phone: "(828) 555-0110" },
  { id: "staff-17", name: "Ryan Gallagher", email: "ryan@ziplineops.com", role: "Lead Guide", locationId: "loc-1", phone: "(828) 555-0111", availability: ["Mon", "Tue", "Wed", "Thu", "Fri"] },
  { id: "staff-18", name: "Zoe Patterson", email: "zoe@ziplineops.com", role: "Guide", locationId: "loc-1", phone: "(828) 555-0112", availability: ["Thu", "Fri", "Sat", "Sun"] },
  // Canyon Creek
  { id: "staff-7", name: "Dylan Nash", email: "dylan@ziplineops.com", role: "Manager", locationId: "loc-2", phone: "(865) 555-0201" },
  { id: "staff-8", name: "Mia Kowalski", email: "mia@ziplineops.com", role: "Lead Guide", locationId: "loc-2", phone: "(865) 555-0202" },
  { id: "staff-9", name: "Tyler Grant", email: "tyler@ziplineops.com", role: "Guide", locationId: "loc-2", phone: "(865) 555-0203" },
  { id: "staff-10", name: "Lily Fontaine", email: "lily@ziplineops.com", role: "Guide", locationId: "loc-2", phone: "(865) 555-0204" },
  { id: "staff-11", name: "Noah Harper", email: "noah@ziplineops.com", role: "Guide", locationId: "loc-2", phone: "(865) 555-0205" },
  { id: "staff-12", name: "Chloe Reyes", email: "chloe@ziplineops.com", role: "Admin", locationId: "loc-2", phone: "(865) 555-0206" },
  { id: "staff-19", name: "Brenda Castillo", email: "brenda@ziplineops.com", role: "Ground Crew", locationId: "loc-2", phone: "(865) 555-0207" },
  { id: "staff-20", name: "Omar Khaled", email: "omar@ziplineops.com", role: "Ground Crew", locationId: "loc-2", phone: "(865) 555-0208" },
  { id: "staff-21", name: "Sophie Turner", email: "sophie@ziplineops.com", role: "Check-in Attendant", locationId: "loc-2", phone: "(865) 555-0209" },
  { id: "staff-22", name: "Liam Connors", email: "liam@ziplineops.com", role: "Check-in Attendant", locationId: "loc-2", phone: "(865) 555-0210", availability: ["Sat", "Sun"] },
]

// ============================================================
// TIME SLOTS GENERATOR
// ============================================================
function generateTimeSlots(locationId: string, capacity: number): TimeSlot[] {
  const slots: TimeSlot[] = []
  for (let dayOffset = -3; dayOffset <= 7; dayOffset++) {
    const date = format(addDays(today, dayOffset), "yyyy-MM-dd")
    for (let hour = 8; hour < 17; hour++) {
      for (let minute = 0; minute < 60; minute += 20) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
        const isToday = dayOffset === 0
        const isPast = dayOffset < 0
        const bookedCount = isPast
          ? Math.floor(rng() * capacity)
          : isToday
            ? Math.floor(rng() * (capacity + 2))
            : Math.floor(rng() * Math.ceil(capacity * 0.7))

        const clamped = Math.min(bookedCount, capacity)
        const ratio = clamped / capacity

        let status: TimeSlot["status"] = "Open"
        if (clamped >= capacity) status = "Full"
        else if (ratio >= 0.5) status = "Filling"

        const staffPool = locationId === "loc-1"
          ? ["staff-2", "staff-3", "staff-4", "staff-5"]
          : ["staff-8", "staff-9", "staff-10", "staff-11"]

        const assignedCount = clamped === 0 ? 0 : Math.min(2, Math.ceil(ratio * 3))
        const assignedStaffIds = staffPool.slice(0, assignedCount)

        slots.push({
          id: `slot-${locationId}-${date}-${time}`,
          locationId,
          date,
          time,
          capacity,
          bookedCount: clamped,
          status,
          assignedStaffIds,
        })
      }
    }
  }
  return slots
}

export const timeSlots: TimeSlot[] = [
  ...generateTimeSlots("loc-1", 12),
  ...generateTimeSlots("loc-2", 10),
]

// ============================================================
// BOOKINGS & GUESTS
// ============================================================
const guestNames = [
  "Alice Johnson", "Bob Martinez", "Charlie Lee", "Diana Pham", "Ethan Brooks",
  "Fiona Walsh", "George Kim", "Hannah Ortiz", "Isaac Nakamura", "Julia Flores",
  "Kevin Desai", "Lauren O'Brien", "Mike Huang", "Nancy Petrova", "Oliver West",
  "Priya Sharma", "Quinn Gallagher", "Rachel Torres", "Sam Whitfield", "Tanya Mbeki",
  "Uma Ramirez", "Victor Chang", "Wendy Liu", "Xavier Ross", "Yuki Tanaka",
  "Zach Bergman", "Amy Chen", "Brian Scott", "Carla Nguyen", "Derek Olsen",
]

function generateGuests(bookingId: string, count: number): BookingGuest[] {
  const guests: BookingGuest[] = []
  const startIdx = parseInt(bookingId.replace("bk-", "")) * 4 % guestNames.length

  for (let i = 0; i < count; i++) {
    const nameIdx = (startIdx + i) % guestNames.length
    const isMinor = i > 0 && rng() > 0.7
    const age = isMinor ? Math.floor(rng() * 6) + 10 : Math.floor(rng() * 30) + 20
    const guardianGuestId = isMinor && guests.length > 0 ? guests[0].id : undefined

    let waiverStatus: BookingGuest["waiverStatus"] = "Outstanding"
    if (isMinor && guardianGuestId) {
      const guardian = guests.find(g => g.id === guardianGuestId)
      waiverStatus = guardian?.waiverStatus === "Signed" ? "Covered" : "Outstanding"
    } else {
      const r = rng()
      waiverStatus = r > 0.6 ? "Signed" : r > 0.3 ? "Sent" : "Outstanding"
    }

    guests.push({
      id: `guest-${bookingId}-${i}`,
      bookingId,
      name: guestNames[nameIdx],
      age,
      isMinor,
      guardianGuestId,
      waiverStatus,
      checkedIn: false,
    })
  }
  return guests
}

const todaySlots = timeSlots.filter(s => s.date === todayStr && s.locationId === "loc-1" && s.bookedCount > 0)
const tomorrowStr = format(addDays(today, 1), "yyyy-MM-dd")
const tomorrowSlots = timeSlots.filter(s => s.date === tomorrowStr && s.locationId === "loc-1" && s.bookedCount > 0)
const loc2Slots = timeSlots.filter(s => s.date === todayStr && s.locationId === "loc-2" && s.bookedCount > 0)

function createBooking(id: string, slot: TimeSlot, contactIdx: number, status: Booking["status"] = "Confirmed"): Booking {
  const partySize = Math.min(slot.bookedCount, Math.floor(rng() * 4) + 2)
  const guests = generateGuests(id, partySize)
  const contactName = guestNames[contactIdx % guestNames.length]
  const paymentStatuses: Booking["paymentStatus"][] = ["Paid", "Pending", "Paid", "Paid"]
  return {
    id,
    locationId: slot.locationId,
    slotId: slot.id,
    date: slot.date,
    time: slot.time,
    contactName,
    contactEmail: `${contactName.toLowerCase().replace(" ", ".")}@email.com`,
    contactPhone: `(555) ${String(100 + contactIdx).padStart(3, "0")}-${String(1000 + contactIdx * 7).slice(0, 4)}`,
    partySize,
    status,
    paymentStatus: paymentStatuses[contactIdx % paymentStatuses.length],
    notes: contactIdx % 3 === 0 ? "Birthday celebration" : "",
    createdAt: format(subDays(today, Math.floor(rng() * 14)), "yyyy-MM-dd'T'HH:mm:ss"),
    guests,
  }
}

export const bookings: Booking[] = [
  ...todaySlots.slice(0, 8).map((slot, i) => createBooking(`bk-${i + 1}`, slot, i)),
  ...tomorrowSlots.slice(0, 5).map((slot, i) => createBooking(`bk-${i + 9}`, slot, i + 8)),
  ...loc2Slots.slice(0, 6).map((slot, i) => createBooking(`bk-${i + 14}`, slot, i + 14)),
  ...todaySlots.slice(8, 12).map((slot, i) => createBooking(`bk-${i + 20}`, slot, i + 20, "Pending")),
  ...todaySlots.slice(12, 14).map((slot, i) => createBooking(`bk-${i + 24}`, slot, i + 24, "Cancelled")),
]

// ============================================================
// CAMPAIGNS
// ============================================================
export const campaigns: Campaign[] = [
  { id: "camp-1", name: "Summer Thrills 2026", channel: "Google Ads", status: "Active", spend: 4500, revenue: 18200, roas: 4.04, cpl: 22.50, impressions: 125000, clicks: 6800, leads: 200, bookings: 85, startDate: "2026-01-15", platformUrl: "https://ads.google.com/aw/campaigns" },
  { id: "camp-2", name: "Family Adventure Pack", channel: "Meta Ads", status: "Active", spend: 3200, revenue: 12800, roas: 4.0, cpl: 32.00, impressions: 98000, clicks: 4200, leads: 100, bookings: 52, startDate: "2026-01-20", platformUrl: "https://adsmanager.facebook.com/adsmanager/manage/campaigns" },
  { id: "camp-3", name: "Corporate Team Building", channel: "Google Ads", status: "Active", spend: 2800, revenue: 14500, roas: 5.18, cpl: 28.00, impressions: 45000, clicks: 2100, leads: 100, bookings: 38, startDate: "2026-02-01", platformUrl: "https://ads.google.com/aw/campaigns" },
  { id: "camp-4", name: "Weekend Warrior", channel: "Meta Ads", status: "Paused", spend: 1800, revenue: 5400, roas: 3.0, cpl: 45.00, impressions: 62000, clicks: 2800, leads: 40, bookings: 18, startDate: "2025-12-01", endDate: "2026-01-31", platformUrl: "https://adsmanager.facebook.com/adsmanager/manage/campaigns" },
  { id: "camp-5", name: "Spring Break Special", channel: "Google Ads", status: "Active", spend: 5200, revenue: 22100, roas: 4.25, cpl: 20.00, impressions: 180000, clicks: 9500, leads: 260, bookings: 110, startDate: "2026-02-01", platformUrl: "https://ads.google.com/aw/campaigns" },
  { id: "camp-6", name: "Local Discovery", channel: "GA4", status: "Active", spend: 0, revenue: 8500, roas: 0, cpl: 0, impressions: 35000, clicks: 4200, leads: 150, bookings: 65, startDate: "2026-01-01", platformUrl: "https://analytics.google.com/analytics/web/" },
  { id: "camp-7", name: "Valentine Couples", channel: "Meta Ads", status: "Ended", spend: 1200, revenue: 4800, roas: 4.0, cpl: 30.00, impressions: 42000, clicks: 1800, leads: 40, bookings: 22, startDate: "2026-02-01", endDate: "2026-02-14", platformUrl: "https://adsmanager.facebook.com/adsmanager/manage/campaigns" },
  { id: "camp-8", name: "Organic Social", channel: "GA4", status: "Active", spend: 0, revenue: 6200, roas: 0, cpl: 0, impressions: 28000, clicks: 3100, leads: 120, bookings: 48, startDate: "2025-11-01", platformUrl: "https://analytics.google.com/analytics/web/" },
]

// ============================================================
// LEADS
// ============================================================
export const leads: Lead[] = [
  { id: "lead-1", name: "Robert Chen", email: "rchen@corp.com", phone: "(404) 555-1001", source: "Google Ads", status: "New", locationId: "loc-1", createdAt: format(subDays(today, 1), "yyyy-MM-dd"), notes: [{ id: "n1", text: "Interested in group booking for 20+", createdAt: format(subDays(today, 1), "yyyy-MM-dd'T'10:00:00"), author: "System" }], value: 2400 },
  { id: "lead-2", name: "Jessica Morales", email: "jmorales@email.com", phone: "(404) 555-1002", source: "Meta Ads", status: "Contacted", locationId: "loc-1", createdAt: format(subDays(today, 2), "yyyy-MM-dd"), notes: [{ id: "n2", text: "Called, left voicemail", createdAt: format(subDays(today, 1), "yyyy-MM-dd'T'14:00:00"), author: "Jake Torres" }], value: 480 },
  { id: "lead-3", name: "Thomas Wright", email: "twright@business.com", phone: "(404) 555-1003", source: "Google Ads", status: "Qualified", locationId: "loc-2", createdAt: format(subDays(today, 5), "yyyy-MM-dd"), notes: [{ id: "n3", text: "Corporate outing for 30 people, needs custom package", createdAt: format(subDays(today, 4), "yyyy-MM-dd'T'09:00:00"), author: "Dylan Nash" }], value: 4500 },
  { id: "lead-4", name: "Amanda Foster", email: "afoster@email.com", phone: "(404) 555-1004", source: "Organic", status: "Won", locationId: "loc-1", createdAt: format(subDays(today, 10), "yyyy-MM-dd"), notes: [{ id: "n4", text: "Booked family package", createdAt: format(subDays(today, 7), "yyyy-MM-dd'T'11:00:00"), author: "Sarah Chen" }], value: 720 },
  { id: "lead-5", name: "Derek Park", email: "dpark@email.com", phone: "(404) 555-1005", source: "Meta Ads", status: "Lost", locationId: "loc-2", createdAt: format(subDays(today, 14), "yyyy-MM-dd"), notes: [{ id: "n5", text: "Price too high, went with competitor", createdAt: format(subDays(today, 10), "yyyy-MM-dd'T'16:00:00"), author: "Dylan Nash" }], value: 360 },
  { id: "lead-6", name: "Sophia Kumar", email: "skumar@corp.com", phone: "(404) 555-1006", source: "Google Ads", status: "New", locationId: "loc-1", createdAt: todayStr, notes: [], value: 960 },
  { id: "lead-7", name: "Brandon Mills", email: "bmills@email.com", phone: "(404) 555-1007", source: "Referral", status: "Contacted", locationId: "loc-1", createdAt: format(subDays(today, 3), "yyyy-MM-dd"), notes: [{ id: "n7", text: "Referred by Amanda Foster, interested in birthday party", createdAt: format(subDays(today, 2), "yyyy-MM-dd'T'10:00:00"), author: "Emma Brooks" }], value: 600 },
  { id: "lead-8", name: "Michelle Tran", email: "mtran@school.edu", phone: "(404) 555-1008", source: "Organic", status: "Qualified", locationId: "loc-2", createdAt: format(subDays(today, 7), "yyyy-MM-dd"), notes: [{ id: "n8", text: "School field trip for 45 students", createdAt: format(subDays(today, 6), "yyyy-MM-dd'T'09:00:00"), author: "Mia Kowalski" }], value: 3600 },
  { id: "lead-9", name: "Ryan Douglas", email: "rdouglas@email.com", phone: "(404) 555-1009", source: "Google Ads", status: "New", locationId: "loc-1", createdAt: format(subDays(today, 1), "yyyy-MM-dd"), notes: [], value: 240 },
  { id: "lead-10", name: "Patricia Young", email: "pyoung@business.com", phone: "(404) 555-1010", source: "Meta Ads", status: "Contacted", locationId: "loc-2", createdAt: format(subDays(today, 4), "yyyy-MM-dd"), notes: [{ id: "n10", text: "Wants info on accessibility options", createdAt: format(subDays(today, 3), "yyyy-MM-dd'T'15:00:00"), author: "Tyler Grant" }], value: 480 },
  { id: "lead-11", name: "David Kim", email: "dkim@corp.com", phone: "(404) 555-1011", source: "Referral", status: "Qualified", locationId: "loc-1", createdAt: format(subDays(today, 8), "yyyy-MM-dd"), notes: [{ id: "n11", text: "Annual company retreat, 50 people", createdAt: format(subDays(today, 7), "yyyy-MM-dd'T'14:00:00"), author: "Jake Torres" }], value: 7500 },
  { id: "lead-12", name: "Caroline Fisher", email: "cfisher@email.com", phone: "(404) 555-1012", source: "Organic", status: "Won", locationId: "loc-2", createdAt: format(subDays(today, 12), "yyyy-MM-dd"), notes: [{ id: "n12", text: "Booked couples package", createdAt: format(subDays(today, 9), "yyyy-MM-dd'T'11:00:00"), author: "Lily Fontaine" }], value: 360 },
  { id: "lead-13", name: "Jason Burke", email: "jburke@email.com", phone: "(404) 555-1013", source: "Google Ads", status: "New", locationId: "loc-1", createdAt: todayStr, notes: [], value: 240 },
  { id: "lead-14", name: "Olivia Zhang", email: "ozhang@email.com", phone: "(404) 555-1014", source: "Meta Ads", status: "Lost", locationId: "loc-1", createdAt: format(subDays(today, 20), "yyyy-MM-dd"), notes: [{ id: "n14", text: "Scheduling conflict, may rebook later", createdAt: format(subDays(today, 18), "yyyy-MM-dd'T'10:00:00"), author: "Sarah Chen" }], value: 480 },
  { id: "lead-15", name: "Andrew Patel", email: "apatel@email.com", phone: "(404) 555-1015", source: "Referral", status: "Contacted", locationId: "loc-2", createdAt: format(subDays(today, 2), "yyyy-MM-dd"), notes: [{ id: "n15", text: "Bachelor party, 8 guests", createdAt: format(subDays(today, 1), "yyyy-MM-dd'T'16:00:00"), author: "Mia Kowalski" }], value: 960 },
  { id: "lead-16", name: "Emily Watson", email: "ewatson@corp.com", phone: "(404) 555-1016", source: "Google Ads", status: "Qualified", locationId: "loc-1", createdAt: format(subDays(today, 6), "yyyy-MM-dd"), notes: [{ id: "n16", text: "Looking at quarterly team events", createdAt: format(subDays(today, 5), "yyyy-MM-dd'T'13:00:00"), author: "Jake Torres" }], value: 3000 },
  { id: "lead-17", name: "Mark Sullivan", email: "msullivan@email.com", phone: "(404) 555-1017", source: "Organic", status: "New", locationId: "loc-2", createdAt: format(subDays(today, 1), "yyyy-MM-dd"), notes: [], value: 240 },
  { id: "lead-18", name: "Lisa Hernandez", email: "lhernandez@email.com", phone: "(404) 555-1018", source: "Meta Ads", status: "Won", locationId: "loc-1", createdAt: format(subDays(today, 15), "yyyy-MM-dd"), notes: [{ id: "n18", text: "Booked sunset tour", createdAt: format(subDays(today, 12), "yyyy-MM-dd'T'09:00:00"), author: "Ava Patel" }], value: 480 },
  { id: "lead-19", name: "Chris Nguyen", email: "cnguyen@business.com", phone: "(404) 555-1019", source: "Google Ads", status: "Contacted", locationId: "loc-2", createdAt: format(subDays(today, 3), "yyyy-MM-dd"), notes: [{ id: "n19", text: "Company picnic add-on", createdAt: format(subDays(today, 2), "yyyy-MM-dd'T'14:00:00"), author: "Noah Harper" }], value: 1800 },
  { id: "lead-20", name: "Rebecca Stone", email: "rstone@email.com", phone: "(404) 555-1020", source: "Referral", status: "New", locationId: "loc-1", createdAt: todayStr, notes: [], value: 360 },
]

// ============================================================
// NURTURE SEQUENCES
// ============================================================
export const nurtureSequences: NurtureSequence[] = [
  {
    id: "seq-1", name: "New Lead 7-Day", description: "Welcome sequence for new leads",
    trigger: "Lead status = New",
    status: "Active",
    steps: [
      { id: "s1-1", type: "Email", subject: "Welcome to {location}!", body: "Hi {first_name}, thanks for your interest in our zipline tours..." },
      { id: "s1-2", type: "Wait", waitDays: 2 },
      { id: "s1-3", type: "Email", subject: "What to Expect on Your Tour", body: "Hey {first_name}, here's everything you need to know..." },
      { id: "s1-4", type: "Wait", waitDays: 3 },
      { id: "s1-5", type: "SMS", body: "Hey {first_name}! Ready to book your zipline adventure? Use code WELCOME10 for 10% off." },
      { id: "s1-6", type: "Condition", conditionField: "booking_status", conditionValue: "booked" },
      { id: "s1-7", type: "Email", subject: "Limited Spots This Weekend!", body: "Hi {first_name}, spots are filling up fast..." },
    ],
    metrics: { enrolled: 342, openRate: 68, clickRate: 24, replyRate: 8, conversionRate: 15 },
  },
  {
    id: "seq-2", name: "Abandoned Booking", description: "Re-engage visitors who started but didn't complete a booking",
    trigger: "Booking started but not completed",
    status: "Active",
    steps: [
      { id: "s2-1", type: "Wait", waitDays: 1 },
      { id: "s2-2", type: "Email", subject: "You left something behind!", body: "Hi {first_name}, looks like you didn't finish your booking for {tour_date}..." },
      { id: "s2-3", type: "Wait", waitDays: 2 },
      { id: "s2-4", type: "SMS", body: "{first_name}, your {location} adventure is waiting! Complete your booking today." },
      { id: "s2-5", type: "Wait", waitDays: 2 },
      { id: "s2-6", type: "Email", subject: "Last chance: 15% off your tour!", body: "Hi {first_name}, we saved your spot..." },
    ],
    metrics: { enrolled: 128, openRate: 72, clickRate: 31, replyRate: 5, conversionRate: 22 },
  },
  {
    id: "seq-3", name: "Post-Tour Upsell", description: "Follow up after a completed tour with upsell opportunities",
    trigger: "Tour completed",
    status: "Active",
    steps: [
      { id: "s3-1", type: "Wait", waitDays: 1 },
      { id: "s3-2", type: "Email", subject: "How was your zipline adventure?", body: "Hi {first_name}, thanks for joining us at {location}!" },
      { id: "s3-3", type: "Wait", waitDays: 7 },
      { id: "s3-4", type: "Email", subject: "Share the thrill - Give $20, Get $20", body: "Hey {first_name}, loved your tour? Share it with friends..." },
      { id: "s3-5", type: "Wait", waitDays: 14 },
      { id: "s3-6", type: "Email", subject: "New tours at {location}!", body: "Hi {first_name}, check out our latest offerings..." },
    ],
    metrics: { enrolled: 856, openRate: 55, clickRate: 18, replyRate: 12, conversionRate: 8 },
  },
  {
    id: "seq-4", name: "Corporate Outreach", description: "Nurture corporate leads for team building events",
    trigger: "Lead source = Corporate",
    status: "Draft",
    steps: [
      { id: "s4-1", type: "Email", subject: "Team Building That Actually Works", body: "Hi {first_name}, ready to take your team to new heights?" },
      { id: "s4-2", type: "Wait", waitDays: 3 },
      { id: "s4-3", type: "Email", subject: "Case Study: How Acme Corp Built Team Trust", body: "Hi {first_name}, see how others have used our programs..." },
      { id: "s4-4", type: "Wait", waitDays: 5 },
      { id: "s4-5", type: "SMS", body: "{first_name}, let's set up a quick call to plan your team event. Reply YES or book at..." },
    ],
    metrics: { enrolled: 45, openRate: 62, clickRate: 28, replyRate: 15, conversionRate: 12 },
  },
]

// ============================================================
// EQUIPMENT
// ============================================================
export const equipmentItems: EquipmentItem[] = [
  { id: "eq-1", category: "Harnesses", name: "Full Body Harness A", serialNumber: "HRN-2024-001", manufacturer: "Petzl", model: "Sequoia SRT", locationId: "loc-1", purchaseDate: "2024-03-15", inServiceDate: "2024-04-01", status: "Active", condition: "Good", lastInspectionDate: format(subDays(today, 5), "yyyy-MM-dd"), notes: "" },
  { id: "eq-2", category: "Harnesses", name: "Full Body Harness B", serialNumber: "HRN-2024-002", manufacturer: "Petzl", model: "Sequoia SRT", locationId: "loc-1", purchaseDate: "2024-03-15", inServiceDate: "2024-04-01", status: "Active", condition: "Good", lastInspectionDate: format(subDays(today, 5), "yyyy-MM-dd"), notes: "" },
  { id: "eq-3", category: "Harnesses", name: "Full Body Harness C", serialNumber: "HRN-2024-003", manufacturer: "Petzl", model: "Sequoia SRT", locationId: "loc-1", purchaseDate: "2024-03-15", inServiceDate: "2024-04-01", status: "Active", condition: "Watch", lastInspectionDate: format(subDays(today, 12), "yyyy-MM-dd"), notes: "Minor abrasion on leg loop" },
  { id: "eq-4", category: "Harnesses", name: "Full Body Harness D", serialNumber: "HRN-2024-004", manufacturer: "Petzl", model: "Sequoia SRT", locationId: "loc-2", purchaseDate: "2024-06-10", inServiceDate: "2024-06-20", status: "Active", condition: "Good", lastInspectionDate: format(subDays(today, 3), "yyyy-MM-dd"), notes: "" },
  { id: "eq-5", category: "Trolleys", name: "Speed Trolley A", serialNumber: "TRL-2024-001", manufacturer: "Zipline Gear", model: "Pro 3000", locationId: "loc-1", purchaseDate: "2024-02-01", inServiceDate: "2024-02-15", status: "Active", condition: "Good", lastInspectionDate: format(subDays(today, 2), "yyyy-MM-dd"), notes: "" },
  { id: "eq-6", category: "Trolleys", name: "Speed Trolley B", serialNumber: "TRL-2024-002", manufacturer: "Zipline Gear", model: "Pro 3000", locationId: "loc-1", purchaseDate: "2024-02-01", inServiceDate: "2024-02-15", status: "Active", condition: "Good", lastInspectionDate: format(subDays(today, 2), "yyyy-MM-dd"), notes: "" },
  { id: "eq-7", category: "Trolleys", name: "Speed Trolley C", serialNumber: "TRL-2024-003", manufacturer: "Zipline Gear", model: "Pro 3000", locationId: "loc-2", purchaseDate: "2024-05-20", inServiceDate: "2024-06-01", status: "Quarantined", condition: "Replace", lastInspectionDate: format(subDays(today, 1), "yyyy-MM-dd"), notes: "Wheel bearing failure detected" },
  { id: "eq-8", category: "Helmets", name: "Climbing Helmet A", serialNumber: "HLM-2024-001", manufacturer: "Petzl", model: "Boreo", locationId: "loc-1", purchaseDate: "2024-01-10", inServiceDate: "2024-01-15", status: "Active", condition: "Good", lastInspectionDate: format(subDays(today, 7), "yyyy-MM-dd"), notes: "" },
  { id: "eq-9", category: "Helmets", name: "Climbing Helmet B", serialNumber: "HLM-2024-002", manufacturer: "Petzl", model: "Boreo", locationId: "loc-1", purchaseDate: "2024-01-10", inServiceDate: "2024-01-15", status: "Active", condition: "Good", lastInspectionDate: format(subDays(today, 7), "yyyy-MM-dd"), notes: "" },
  { id: "eq-10", category: "Helmets", name: "Climbing Helmet C", serialNumber: "HLM-2024-003", manufacturer: "Petzl", model: "Boreo", locationId: "loc-2", purchaseDate: "2024-06-15", inServiceDate: "2024-06-20", status: "Active", condition: "Good", lastInspectionDate: format(subDays(today, 4), "yyyy-MM-dd"), notes: "" },
  { id: "eq-11", category: "Lanyards", name: "Double Lanyard A", serialNumber: "LNY-2024-001", manufacturer: "Petzl", model: "Jane-Y", locationId: "loc-1", purchaseDate: "2024-03-15", inServiceDate: "2024-04-01", status: "Active", condition: "Good", lastInspectionDate: format(subDays(today, 5), "yyyy-MM-dd"), notes: "" },
  { id: "eq-12", category: "Lanyards", name: "Double Lanyard B", serialNumber: "LNY-2024-002", manufacturer: "Petzl", model: "Jane-Y", locationId: "loc-2", purchaseDate: "2024-06-10", inServiceDate: "2024-06-20", status: "Active", condition: "Watch", lastInspectionDate: format(subDays(today, 8), "yyyy-MM-dd"), notes: "Slight fraying on one arm" },
  { id: "eq-13", category: "Carabiners", name: "Auto-Lock Carabiner Set A", serialNumber: "CRB-2024-001", manufacturer: "Petzl", model: "Am'D", locationId: "loc-1", purchaseDate: "2024-03-15", inServiceDate: "2024-04-01", status: "Active", condition: "Good", lastInspectionDate: format(subDays(today, 5), "yyyy-MM-dd"), notes: "" },
  { id: "eq-14", category: "Carabiners", name: "Auto-Lock Carabiner Set B", serialNumber: "CRB-2024-002", manufacturer: "Petzl", model: "Am'D", locationId: "loc-2", purchaseDate: "2024-06-10", inServiceDate: "2024-06-20", status: "Active", condition: "Good", lastInspectionDate: format(subDays(today, 3), "yyyy-MM-dd"), notes: "" },
  { id: "eq-15", category: "Brakes", name: "Braking System A", serialNumber: "BRK-2024-001", manufacturer: "ZipSTOP", model: "IR", locationId: "loc-1", purchaseDate: "2023-06-01", inServiceDate: "2023-06-15", status: "Active", condition: "Good", lastInspectionDate: format(subDays(today, 10), "yyyy-MM-dd"), notes: "" },
  { id: "eq-16", category: "Brakes", name: "Braking System B", serialNumber: "BRK-2024-002", manufacturer: "ZipSTOP", model: "IR", locationId: "loc-2", purchaseDate: "2024-01-15", inServiceDate: "2024-02-01", status: "Active", condition: "Good", lastInspectionDate: format(subDays(today, 6), "yyyy-MM-dd"), notes: "" },
  { id: "eq-17", category: "Tower Components", name: "Platform Assembly - Tower 1", serialNumber: "TWR-2023-001", manufacturer: "Custom", model: "Steel Platform", locationId: "loc-1", purchaseDate: "2023-01-01", inServiceDate: "2023-03-01", status: "Active", condition: "Good", lastInspectionDate: format(subDays(today, 30), "yyyy-MM-dd"), notes: "" },
  { id: "eq-18", category: "Tower Components", name: "Cable Assembly - Line 1", serialNumber: "TWR-2023-002", manufacturer: "Bridon-Bekaert", model: "19mm Cable", locationId: "loc-1", purchaseDate: "2023-01-01", inServiceDate: "2023-03-01", status: "Active", condition: "Good", lastInspectionDate: format(subDays(today, 30), "yyyy-MM-dd"), notes: "" },
  { id: "eq-19", category: "Harnesses", name: "Full Body Harness E", serialNumber: "HRN-2023-010", manufacturer: "Petzl", model: "Sequoia SRT", locationId: "loc-1", purchaseDate: "2023-03-01", inServiceDate: "2023-03-15", status: "Retired", condition: "Replace", lastInspectionDate: format(subDays(today, 60), "yyyy-MM-dd"), notes: "End of service life" },
  { id: "eq-20", category: "Trolleys", name: "Speed Trolley D", serialNumber: "TRL-2023-005", manufacturer: "Zipline Gear", model: "Pro 2000", locationId: "loc-2", purchaseDate: "2023-05-01", inServiceDate: "2023-05-15", status: "Retired", condition: "Replace", lastInspectionDate: format(subDays(today, 45), "yyyy-MM-dd"), notes: "Upgraded to Pro 3000" },
  { id: "eq-21", category: "Helmets", name: "Climbing Helmet D", serialNumber: "HLM-2023-008", manufacturer: "Petzl", model: "Vertex", locationId: "loc-1", purchaseDate: "2023-01-01", inServiceDate: "2023-01-15", status: "Active", condition: "Watch", lastInspectionDate: format(subDays(today, 14), "yyyy-MM-dd"), notes: "Shell discoloration, monitoring" },
  { id: "eq-22", category: "Lanyards", name: "Double Lanyard C", serialNumber: "LNY-2023-005", manufacturer: "Petzl", model: "Jane-Y", locationId: "loc-1", purchaseDate: "2023-03-15", inServiceDate: "2023-04-01", status: "Active", condition: "Good", lastInspectionDate: format(subDays(today, 5), "yyyy-MM-dd"), notes: "" },
  { id: "eq-23", category: "Carabiners", name: "Auto-Lock Carabiner Set C", serialNumber: "CRB-2023-003", manufacturer: "Petzl", model: "Am'D", locationId: "loc-1", purchaseDate: "2023-03-15", inServiceDate: "2023-04-01", status: "Active", condition: "Good", lastInspectionDate: format(subDays(today, 5), "yyyy-MM-dd"), notes: "" },
  { id: "eq-24", category: "Harnesses", name: "Full Body Harness F", serialNumber: "HRN-2024-005", manufacturer: "Petzl", model: "Sequoia SRT", locationId: "loc-2", purchaseDate: "2024-06-10", inServiceDate: "2024-06-20", status: "Active", condition: "Good", lastInspectionDate: format(subDays(today, 3), "yyyy-MM-dd"), notes: "" },
  { id: "eq-25", category: "Helmets", name: "Climbing Helmet E", serialNumber: "HLM-2024-004", manufacturer: "Petzl", model: "Boreo", locationId: "loc-2", purchaseDate: "2024-06-15", inServiceDate: "2024-06-20", status: "Active", condition: "Good", lastInspectionDate: format(subDays(today, 4), "yyyy-MM-dd"), notes: "" },
]

// ============================================================
// INSPECTIONS
// ============================================================
export const inspections: Inspection[] = [
  {
    id: "insp-1", equipmentId: "eq-1", inspectorId: "staff-2", date: format(subDays(today, 5), "yyyy-MM-dd"), type: "Routine",
    overallResult: "Pass",
    checklist: [
      { id: "cl-1", label: "Webbing condition", result: "Pass" },
      { id: "cl-2", label: "Buckle function", result: "Pass" },
      { id: "cl-3", label: "Stitching integrity", result: "Pass" },
      { id: "cl-4", label: "Label legibility", result: "Pass" },
    ],
    notes: "All clear", photos: [],
  },
  {
    id: "insp-2", equipmentId: "eq-3", inspectorId: "staff-2", date: format(subDays(today, 12), "yyyy-MM-dd"), type: "Routine",
    overallResult: "Needs Adjustment",
    checklist: [
      { id: "cl-5", label: "Webbing condition", result: "Needs Adjustment" },
      { id: "cl-6", label: "Buckle function", result: "Pass" },
      { id: "cl-7", label: "Stitching integrity", result: "Pass" },
      { id: "cl-8", label: "Label legibility", result: "Pass" },
    ],
    notes: "Minor abrasion on leg loop webbing. Monitor closely.", photos: [],
  },
  {
    id: "insp-3", equipmentId: "eq-7", inspectorId: "staff-8", date: format(subDays(today, 1), "yyyy-MM-dd"), type: "Pre-use",
    overallResult: "Fail",
    checklist: [
      { id: "cl-9", label: "Wheel rotation", result: "Fail" },
      { id: "cl-10", label: "Frame integrity", result: "Pass" },
      { id: "cl-11", label: "Sheave condition", result: "Needs Adjustment" },
      { id: "cl-12", label: "Safety latch", result: "Pass" },
    ],
    notes: "Wheel bearing failure. Quarantine immediately.", photos: [],
  },
  {
    id: "insp-4", equipmentId: "eq-5", inspectorId: "staff-2", date: format(subDays(today, 2), "yyyy-MM-dd"), type: "Routine",
    overallResult: "Pass",
    checklist: [
      { id: "cl-13", label: "Wheel rotation", result: "Pass" },
      { id: "cl-14", label: "Frame integrity", result: "Pass" },
      { id: "cl-15", label: "Sheave condition", result: "Pass" },
      { id: "cl-16", label: "Safety latch", result: "Pass" },
    ],
    notes: "", photos: [],
  },
  {
    id: "insp-5", equipmentId: "eq-8", inspectorId: "staff-3", date: format(subDays(today, 7), "yyyy-MM-dd"), type: "Routine",
    overallResult: "Pass",
    checklist: [
      { id: "cl-17", label: "Shell condition", result: "Pass" },
      { id: "cl-18", label: "Chin strap", result: "Pass" },
      { id: "cl-19", label: "Headband adjustment", result: "Pass" },
    ],
    notes: "", photos: [],
  },
  {
    id: "insp-6", equipmentId: "eq-15", inspectorId: "staff-1", date: format(subDays(today, 10), "yyyy-MM-dd"), type: "Annual",
    overallResult: "Pass",
    checklist: [
      { id: "cl-20", label: "Braking mechanism", result: "Pass" },
      { id: "cl-21", label: "Cable wear", result: "Pass" },
      { id: "cl-22", label: "Reset function", result: "Pass" },
      { id: "cl-23", label: "Mounting hardware", result: "Pass" },
    ],
    notes: "Annual inspection completed by manufacturer rep.", photos: [],
  },
  {
    id: "insp-7", equipmentId: "eq-11", inspectorId: "staff-2", date: format(subDays(today, 5), "yyyy-MM-dd"), type: "Routine",
    overallResult: "Pass",
    checklist: [
      { id: "cl-24", label: "Webbing condition", result: "Pass" },
      { id: "cl-25", label: "Connector integrity", result: "Pass" },
      { id: "cl-26", label: "Energy absorber", result: "Pass" },
    ],
    notes: "", photos: [],
  },
  {
    id: "insp-8", equipmentId: "eq-12", inspectorId: "staff-8", date: format(subDays(today, 8), "yyyy-MM-dd"), type: "Routine",
    overallResult: "Needs Adjustment",
    checklist: [
      { id: "cl-27", label: "Webbing condition", result: "Needs Adjustment" },
      { id: "cl-28", label: "Connector integrity", result: "Pass" },
      { id: "cl-29", label: "Energy absorber", result: "Pass" },
    ],
    notes: "Slight fraying on one arm. Watch list.", photos: [],
  },
  {
    id: "insp-9", equipmentId: "eq-17", inspectorId: "staff-1", date: format(subDays(today, 30), "yyyy-MM-dd"), type: "Annual",
    overallResult: "Pass",
    checklist: [
      { id: "cl-30", label: "Structural integrity", result: "Pass" },
      { id: "cl-31", label: "Bolt torque", result: "Pass" },
      { id: "cl-32", label: "Rust/corrosion", result: "Pass" },
      { id: "cl-33", label: "Guardrails", result: "Pass" },
    ],
    notes: "Annual tower inspection complete.", photos: [],
  },
  {
    id: "insp-10", equipmentId: "eq-21", inspectorId: "staff-3", date: format(subDays(today, 14), "yyyy-MM-dd"), type: "Routine",
    overallResult: "Needs Adjustment",
    checklist: [
      { id: "cl-34", label: "Shell condition", result: "Needs Adjustment" },
      { id: "cl-35", label: "Chin strap", result: "Pass" },
      { id: "cl-36", label: "Headband adjustment", result: "Pass" },
    ],
    notes: "Shell discoloration noted. UV damage possible. Added to watch list.", photos: [],
  },
  {
    id: "insp-11", equipmentId: "eq-4", inspectorId: "staff-8", date: format(subDays(today, 3), "yyyy-MM-dd"), type: "Routine",
    overallResult: "Pass",
    checklist: [
      { id: "cl-37", label: "Webbing condition", result: "Pass" },
      { id: "cl-38", label: "Buckle function", result: "Pass" },
      { id: "cl-39", label: "Stitching integrity", result: "Pass" },
    ],
    notes: "", photos: [],
  },
  {
    id: "insp-12", equipmentId: "eq-13", inspectorId: "staff-2", date: format(subDays(today, 5), "yyyy-MM-dd"), type: "Routine",
    overallResult: "Pass",
    checklist: [
      { id: "cl-40", label: "Gate function", result: "Pass" },
      { id: "cl-41", label: "Locking mechanism", result: "Pass" },
      { id: "cl-42", label: "Body integrity", result: "Pass" },
    ],
    notes: "", photos: [],
  },
  {
    id: "insp-13", equipmentId: "eq-16", inspectorId: "staff-7", date: format(subDays(today, 6), "yyyy-MM-dd"), type: "Routine",
    overallResult: "Pass",
    checklist: [
      { id: "cl-43", label: "Braking mechanism", result: "Pass" },
      { id: "cl-44", label: "Cable wear", result: "Pass" },
      { id: "cl-45", label: "Reset function", result: "Pass" },
    ],
    notes: "", photos: [],
  },
  {
    id: "insp-14", equipmentId: "eq-18", inspectorId: "staff-1", date: format(subDays(today, 30), "yyyy-MM-dd"), type: "Annual",
    overallResult: "Pass",
    checklist: [
      { id: "cl-46", label: "Cable tension", result: "Pass" },
      { id: "cl-47", label: "Termination hardware", result: "Pass" },
      { id: "cl-48", label: "Wire condition", result: "Pass" },
    ],
    notes: "Annual cable inspection complete.", photos: [],
  },
  {
    id: "insp-15", equipmentId: "eq-6", inspectorId: "staff-2", date: format(subDays(today, 2), "yyyy-MM-dd"), type: "Pre-use",
    overallResult: "Pass",
    checklist: [
      { id: "cl-49", label: "Wheel rotation", result: "Pass" },
      { id: "cl-50", label: "Frame integrity", result: "Pass" },
      { id: "cl-51", label: "Safety latch", result: "Pass" },
    ],
    notes: "", photos: [],
  },
]

// ============================================================
// MAINTENANCE TASKS
// ============================================================
export const maintenanceTasks: MaintenanceTask[] = [
  { id: "mt-1", equipmentId: "eq-7", inspectionId: "insp-3", title: "Replace wheel bearing - TRL-2024-003", description: "Wheel bearing failure detected during pre-use inspection. Replace bearing assembly.", status: "Open", priority: "Critical", assignedToId: "staff-9", createdAt: format(subDays(today, 1), "yyyy-MM-dd"), partsUsed: [], laborNotes: "" },
  { id: "mt-2", equipmentId: "eq-3", inspectionId: "insp-2", title: "Monitor leg loop abrasion - HRN-2024-003", description: "Minor abrasion on leg loop webbing. Monitor and replace if progresses.", status: "In Progress", priority: "Medium", assignedToId: "staff-3", createdAt: format(subDays(today, 12), "yyyy-MM-dd"), partsUsed: [], laborNotes: "Marked area with tape for monitoring" },
  { id: "mt-3", equipmentId: "eq-12", inspectionId: "insp-8", title: "Assess lanyard fraying - LNY-2024-002", description: "Slight fraying on one arm. Assess if replacement needed.", status: "Waiting Parts", priority: "High", assignedToId: "staff-10", createdAt: format(subDays(today, 8), "yyyy-MM-dd"), partsUsed: ["Replacement lanyard arm"], laborNotes: "Ordered replacement part from Petzl" },
  { id: "mt-4", equipmentId: "eq-21", inspectionId: "insp-10", title: "UV damage assessment - HLM-2023-008", description: "Shell discoloration from UV damage. Full assessment needed.", status: "In Progress", priority: "Medium", assignedToId: "staff-3", createdAt: format(subDays(today, 14), "yyyy-MM-dd"), partsUsed: [], laborNotes: "Comparing with manufacturer specs for acceptable discoloration" },
  { id: "mt-5", equipmentId: "eq-15", title: "Scheduled lubrication - BRK-2024-001", description: "Quarterly lubrication of braking mechanism.", status: "Completed", priority: "Low", assignedToId: "staff-5", createdAt: format(subDays(today, 20), "yyyy-MM-dd"), completedAt: format(subDays(today, 18), "yyyy-MM-dd"), partsUsed: ["Brake lubricant"], laborNotes: "Applied manufacturer-recommended lubricant. Function tested OK." },
  { id: "mt-6", equipmentId: "eq-5", title: "Sheave replacement - TRL-2024-001", description: "Preventive sheave replacement per manufacturer schedule.", status: "Completed", priority: "Medium", assignedToId: "staff-4", createdAt: format(subDays(today, 15), "yyyy-MM-dd"), completedAt: format(subDays(today, 13), "yyyy-MM-dd"), partsUsed: ["Replacement sheave assembly"], laborNotes: "Sheave replaced and tested. Runs smooth." },
  { id: "mt-7", equipmentId: "eq-17", title: "Bolt re-torque - TWR-2023-001", description: "Re-torque all structural bolts per annual schedule.", status: "Verified", priority: "Medium", assignedToId: "staff-1", createdAt: format(subDays(today, 32), "yyyy-MM-dd"), completedAt: format(subDays(today, 30), "yyyy-MM-dd"), partsUsed: [], laborNotes: "All bolts re-torqued to spec. Documented." },
  { id: "mt-8", equipmentId: "eq-18", title: "Cable tension adjustment - TWR-2023-002", description: "Adjust cable tension to within spec after annual inspection.", status: "Verified", priority: "High", assignedToId: "staff-1", createdAt: format(subDays(today, 31), "yyyy-MM-dd"), completedAt: format(subDays(today, 29), "yyyy-MM-dd"), partsUsed: [], laborNotes: "Tension adjusted from 4.2kN to 4.5kN. Within manufacturer spec." },
  { id: "mt-9", equipmentId: "eq-8", title: "Headband replacement - HLM-2024-001", description: "Replace worn headband padding.", status: "Open", priority: "Low", assignedToId: "staff-4", createdAt: format(subDays(today, 3), "yyyy-MM-dd"), partsUsed: [], laborNotes: "" },
  { id: "mt-10", equipmentId: "eq-16", title: "Annual brake service - BRK-2024-002", description: "Complete annual brake service per manufacturer guidelines.", status: "Open", priority: "Medium", assignedToId: "staff-10", createdAt: format(subDays(today, 2), "yyyy-MM-dd"), partsUsed: [], laborNotes: "" },
]

// ============================================================
// RESOURCES
// ============================================================
export const resources: Resource[] = [
  { id: "res-1", title: "Petzl Harness Inspection Guide", description: "Official manufacturer guide for inspecting Petzl harnesses", type: "Manual", url: "https://petzl.com/guides/harness-inspection", category: "Equipment", tags: ["harness", "inspection", "petzl"], createdAt: "2024-01-15" },
  { id: "res-2", title: "Daily Operations Checklist", description: "Standard daily opening and closing procedures", type: "Document", category: "Operations", tags: ["daily", "checklist", "procedures"], createdAt: "2024-02-01" },
  { id: "res-3", title: "Skyline Ziplines YouTube", description: "Official YouTube channel with safety videos and tour previews", type: "Video", url: "https://youtube.com/@skylineziplines", category: "Marketing", tags: ["video", "marketing", "safety"], createdAt: "2024-01-01" },
  { id: "res-4", title: "Emergency Response Plan", description: "Comprehensive emergency response procedures for all scenarios", type: "Document", category: "Safety", tags: ["emergency", "safety", "procedures"], createdAt: "2023-06-01" },
  { id: "res-5", title: "Guest Waiver Template", description: "Current guest waiver and liability release form", type: "Document", category: "Legal", tags: ["waiver", "legal", "guest"], createdAt: "2024-03-01" },
  { id: "res-6", title: "ACCT Standards Reference", description: "Association for Challenge Course Technology standards overview", type: "Link", url: "https://acctinfo.org/standards", category: "Compliance", tags: ["standards", "compliance", "acct"], createdAt: "2024-01-01" },
  { id: "res-7", title: "Staff Training Manual", description: "Complete training guide for new guides and lead guides", type: "Manual", category: "Training", tags: ["training", "staff", "guide"], createdAt: "2024-04-01" },
  { id: "res-8", title: "ZipSTOP Brake Maintenance Video", description: "Manufacturer maintenance video for ZipSTOP braking systems", type: "Video", url: "https://youtube.com/zipstop-maintenance", category: "Equipment", tags: ["brake", "maintenance", "video"], createdAt: "2024-02-15" },
]

// ============================================================
// CERTIFICATES
// ============================================================
export const certificates: Certificate[] = [
  { id: "cert-1", staffId: "staff-1", type: "ACCT Level 2 Practitioner", issueDate: "2024-06-15", expiryDate: "2026-06-15", status: "Valid" },
  { id: "cert-2", staffId: "staff-2", type: "ACCT Level 2 Practitioner", issueDate: "2024-08-01", expiryDate: "2026-08-01", status: "Valid" },
  { id: "cert-3", staffId: "staff-3", type: "ACCT Level 1 Practitioner", issueDate: "2025-01-15", expiryDate: "2027-01-15", status: "Valid" },
  { id: "cert-4", staffId: "staff-7", type: "ACCT Level 2 Practitioner", issueDate: "2024-03-01", expiryDate: "2026-03-01", status: "Expiring Soon" },
  { id: "cert-5", staffId: "staff-8", type: "ACCT Level 1 Practitioner", issueDate: "2024-05-15", expiryDate: "2026-05-15", status: "Valid" },
  { id: "cert-6", staffId: "staff-1", type: "Wilderness First Responder", issueDate: "2024-01-01", expiryDate: "2026-01-01", status: "Expired" },
  { id: "cert-7", staffId: "staff-2", type: "Wilderness First Responder", issueDate: "2025-03-01", expiryDate: "2027-03-01", status: "Valid" },
  { id: "cert-8", staffId: "staff-7", type: "Wilderness First Responder", issueDate: "2025-06-01", expiryDate: "2027-06-01", status: "Valid" },
]

// ============================================================
// FAQ ITEMS
// ============================================================
export const faqItems: FAQItem[] = [
  { id: "faq-1", question: "What is the minimum age for the zipline tour?", answer: "Guests must be at least 10 years old and weigh between 70-275 lbs. Guests under 16 must be accompanied by a guardian who signs the waiver.", category: "General", tags: ["age", "requirements"], published: true, usedByAI: true, createdAt: "2024-01-01" },
  { id: "faq-2", question: "What should I wear?", answer: "Wear closed-toe shoes (no sandals), comfortable clothing that allows movement. Avoid loose jewelry. Long hair should be tied back.", category: "Preparation", tags: ["clothing", "preparation"], published: true, usedByAI: true, createdAt: "2024-01-01" },
  { id: "faq-3", question: "What happens if it rains?", answer: "Tours operate in light rain. In case of thunderstorms or high winds, we'll reschedule your tour at no extra charge. We'll notify you via text/email.", category: "Weather", tags: ["weather", "cancellation"], published: true, usedByAI: true, createdAt: "2024-01-01" },
  { id: "faq-4", question: "How long is the tour?", answer: "The full zipline tour takes approximately 2-2.5 hours, including safety briefing, equipment fitting, and 7 zipline runs.", category: "General", tags: ["duration", "tour"], published: true, usedByAI: true, createdAt: "2024-01-01" },
  { id: "faq-5", question: "Can I bring a camera?", answer: "Small cameras secured with a wrist strap are allowed. GoPros with approved mounts are permitted. Phones must be in a secure zippered pocket or lanyard.", category: "General", tags: ["camera", "photos"], published: true, usedByAI: true, createdAt: "2024-01-01" },
  { id: "faq-6", question: "What is your cancellation policy?", answer: "Full refund for cancellations 48+ hours before your tour. 50% refund for 24-48 hours. No refund for less than 24 hours, but we offer free rescheduling.", category: "Booking", tags: ["cancellation", "refund"], published: true, usedByAI: true, createdAt: "2024-01-01" },
  { id: "faq-7", question: "Do you offer group discounts?", answer: "Yes! Groups of 10+ receive 10% off. Groups of 20+ receive 15% off. Corporate packages available with additional perks.", category: "Booking", tags: ["groups", "discount"], published: true, usedByAI: true, createdAt: "2024-01-01" },
  { id: "faq-8", question: "Is the zipline safe?", answer: "Absolutely. All equipment is inspected daily and maintained per ACCT standards. Our guides hold professional certifications. We maintain a perfect safety record.", category: "Safety", tags: ["safety", "equipment"], published: true, usedByAI: true, createdAt: "2024-01-01" },
  { id: "faq-9", question: "What are your operating hours?", answer: "We operate 7 days a week from 8:00 AM to 5:00 PM, with departures every 20 minutes. Last tour departs at 4:40 PM.", category: "General", tags: ["hours", "schedule"], published: true, usedByAI: false, createdAt: "2024-01-01" },
  { id: "faq-10", question: "Do I need to sign a waiver?", answer: "Yes, all guests must sign a waiver before the tour. Guests under 16 can be covered under their guardian's waiver. We send digital waivers via email after booking.", category: "Booking", tags: ["waiver", "legal"], published: true, usedByAI: true, createdAt: "2024-01-01" },
]

// ============================================================
// INTEGRATIONS
// ============================================================
export const integrations: Integration[] = [
  { id: "int-1", name: "Stripe", type: "Payments", status: "Connected", lastSync: format(subDays(today, 0), "yyyy-MM-dd'T'08:00:00"), icon: "CreditCard" },
  { id: "int-2", name: "Google Analytics 4", type: "Analytics", status: "Connected", lastSync: format(subDays(today, 0), "yyyy-MM-dd'T'06:00:00"), icon: "BarChart3" },
  { id: "int-3", name: "Google Ads", type: "Advertising", status: "Connected", lastSync: format(subDays(today, 0), "yyyy-MM-dd'T'07:00:00"), icon: "Target" },
  { id: "int-4", name: "Meta Ads", type: "Advertising", status: "Connected", lastSync: format(subDays(today, 1), "yyyy-MM-dd'T'23:00:00"), icon: "Share2" },
  { id: "int-5", name: "Google Drive", type: "Storage", status: "Disconnected", icon: "HardDrive" },
  { id: "int-6", name: "OneDrive", type: "Storage", status: "Disconnected", icon: "Cloud" },
]

// ============================================================
// OPS ALERTS
// ============================================================
export function generateOpsAlerts(locationId: string): OpsAlert[] {
  const locationSlots = timeSlots.filter(s => s.date === todayStr && s.locationId === locationId)
  const alerts: OpsAlert[] = []

  const overbookedSlots = locationSlots.filter(s => s.bookedCount > s.capacity)
  for (const slot of overbookedSlots.slice(0, 2)) {
    alerts.push({
      id: `alert-ob-${slot.id}`,
      type: "overbooked",
      severity: "critical",
      title: `Overbooked: ${slot.time} departure`,
      description: `${slot.bookedCount}/${slot.capacity} guests booked`,
      slotId: slot.id,
      timestamp: format(today, "yyyy-MM-dd'T'HH:mm:ss"),
    })
  }

  const understaffedSlots = locationSlots.filter(s => s.bookedCount > 6 && s.assignedStaffIds.length < 2)
  for (const slot of understaffedSlots.slice(0, 2)) {
    alerts.push({
      id: `alert-ms-${slot.id}`,
      type: "missing-staff",
      severity: "warning",
      title: `Low staff: ${slot.time} departure`,
      description: `${slot.assignedStaffIds.length} staff for ${slot.bookedCount} guests`,
      slotId: slot.id,
      timestamp: format(today, "yyyy-MM-dd'T'HH:mm:ss"),
    })
  }

  const locationBookings = bookings.filter(b => b.locationId === locationId && b.date === todayStr)
  const outstandingWaivers = locationBookings.flatMap(b => b.guests).filter(g => g.waiverStatus === "Outstanding")
  if (outstandingWaivers.length > 0) {
    alerts.push({
      id: `alert-wv-${locationId}`,
      type: "waiver-gap",
      severity: "warning",
      title: `${outstandingWaivers.length} outstanding waivers`,
      description: "Guests with unsigned waivers for today's tours",
      timestamp: format(today, "yyyy-MM-dd'T'HH:mm:ss"),
    })
  }

  const expiredCerts = certificates.filter(c => c.status === "Expired")
  if (expiredCerts.length > 0) {
    alerts.push({
      id: `alert-cert-${locationId}`,
      type: "certificate",
      severity: "critical",
      title: `${expiredCerts.length} expired certificate(s)`,
      description: "Staff certificates require renewal",
      timestamp: format(today, "yyyy-MM-dd'T'HH:mm:ss"),
    })
  }

  return alerts
}

// ============================================================
// TIMELINE EVENTS (for equipment detail)
// ============================================================
export function getEquipmentTimeline(equipmentId: string): TimelineEvent[] {
  const equipment = equipmentItems.find(e => e.id === equipmentId)
  if (!equipment) return []

  const events: TimelineEvent[] = [
    { id: `tl-purchase-${equipmentId}`, date: equipment.purchaseDate, type: "purchase", title: "Purchased", description: `${equipment.manufacturer} ${equipment.model}` },
    { id: `tl-service-${equipmentId}`, date: equipment.inServiceDate, type: "in-service", title: "Put in service", description: `At ${locations.find(l => l.id === equipment.locationId)?.name}` },
  ]

  const equipInspections = inspections.filter(i => i.equipmentId === equipmentId)
  for (const insp of equipInspections) {
    events.push({
      id: `tl-insp-${insp.id}`,
      date: insp.date,
      type: "inspection",
      title: `${insp.type} Inspection`,
      description: insp.notes || "No notes",
      result: insp.overallResult,
    })
  }

  const equipMaintenance = maintenanceTasks.filter(m => m.equipmentId === equipmentId)
  for (const task of equipMaintenance) {
    events.push({
      id: `tl-maint-${task.id}`,
      date: task.createdAt.split("T")[0] || task.createdAt,
      type: "maintenance",
      title: task.title,
      description: task.laborNotes || task.description,
      result: task.status,
    })
  }

  if (equipment.status === "Quarantined") {
    events.push({
      id: `tl-quarantine-${equipmentId}`,
      date: equipment.lastInspectionDate,
      type: "status-change",
      title: "Quarantined",
      description: equipment.notes || "Status changed to quarantined",
    })
  }

  if (equipment.status === "Retired") {
    events.push({
      id: `tl-retired-${equipmentId}`,
      date: equipment.lastInspectionDate,
      type: "status-change",
      title: "Retired",
      description: equipment.notes || "Equipment retired from service",
    })
  }

  return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
}

// ============================================================
// MARKETING CHART DATA
// ============================================================
export function generateChartData(days: number) {
  const chartRng = createRng(days * 100 + 7)
  const data = []
  for (let i = days; i >= 0; i--) {
    const date = format(subDays(today, i), "MMM dd")
    data.push({
      date,
      sessions: Math.floor(chartRng() * 500) + 200,
      leads: Math.floor(chartRng() * 30) + 5,
      spend: Math.floor(chartRng() * 300) + 100,
      revenue: Math.floor(chartRng() * 1500) + 300,
    })
  }
  return data
}

export const channelROAS = [
  { channel: "Google Ads", roas: 4.5 },
  { channel: "Meta Ads", roas: 3.8 },
  { channel: "GA4 / Organic", roas: 8.2 },
]

export const funnelData = [
  { stage: "Visits", count: 45200 },
  { stage: "Leads", count: 1010 },
  { stage: "Bookings", count: 438 },
  { stage: "Attended", count: 392 },
]

// ============================================================
// INVOICES
// ============================================================
function createInvoice(
  id: string, bookingId: string, locationId: string,
  contactName: string, contactEmail: string,
  status: Invoice["status"], daysAgo: number, partySize: number,
  extras: { photo?: boolean; video?: boolean; merch?: boolean } = {}
): Invoice {
  const unitPrice = locationId === "loc-1" ? 89 : 79
  const lineItems: Invoice["lineItems"] = [
    { id: `${id}-li-1`, description: "Zipline Tour - Standard", quantity: partySize, unitPrice, total: partySize * unitPrice },
  ]
  if (extras.photo) lineItems.push({ id: `${id}-li-2`, description: "Photo Package", quantity: 1, unitPrice: 45, total: 45 })
  if (extras.video) lineItems.push({ id: `${id}-li-3`, description: "GoPro Video Add-on", quantity: partySize, unitPrice: 25, total: partySize * 25 })
  if (extras.merch) lineItems.push({ id: `${id}-li-4`, description: "Souvenir T-Shirt", quantity: partySize, unitPrice: 28, total: partySize * 28 })

  const subtotal = lineItems.reduce((sum, li) => sum + li.total, 0)
  const tax = Math.round(subtotal * 0.07 * 100) / 100
  const total = Math.round((subtotal + tax) * 100) / 100

  const issuedDate = format(subDays(today, daysAgo), "yyyy-MM-dd")
  const dueDate = format(addDays(subDays(today, daysAgo), 14), "yyyy-MM-dd")
  const paidDate = status === "Paid" ? format(subDays(today, Math.max(daysAgo - 3, 0)), "yyyy-MM-dd") : undefined

  return {
    id, bookingId, locationId, contactName, contactEmail,
    amount: subtotal, tax, total, status,
    issuedDate, dueDate, paidDate,
    lineItems,
    notes: status === "Overdue" ? "Follow-up sent via email" : "",
  }
}

export const invoices: Invoice[] = [
  createInvoice("inv-1", "bk-1", "loc-1", "Alice Johnson", "alice.johnson@email.com", "Paid", 10, 4, { photo: true }),
  createInvoice("inv-2", "bk-2", "loc-1", "Bob Martinez", "bob.martinez@email.com", "Paid", 8, 2, { video: true }),
  createInvoice("inv-3", "bk-3", "loc-1", "Charlie Lee", "charlie.lee@email.com", "Sent", 3, 6, { photo: true, merch: true }),
  createInvoice("inv-4", "bk-4", "loc-1", "Diana Pham", "diana.pham@email.com", "Overdue", 18, 3),
  createInvoice("inv-5", "bk-5", "loc-1", "Ethan Brooks", "ethan.brooks@email.com", "Paid", 5, 5, { video: true, merch: true }),
  createInvoice("inv-6", "bk-9", "loc-1", "Fiona Walsh", "fiona.walsh@email.com", "Draft", 1, 4),
  createInvoice("inv-7", "bk-10", "loc-1", "George Kim", "george.kim@email.com", "Sent", 2, 2, { photo: true }),
  createInvoice("inv-8", "bk-14", "loc-2", "Hannah Ortiz", "hannah.ortiz@email.com", "Paid", 12, 3, { photo: true }),
  createInvoice("inv-9", "bk-15", "loc-2", "Isaac Nakamura", "isaac.nakamura@email.com", "Paid", 7, 6, { video: true }),
  createInvoice("inv-10", "bk-16", "loc-2", "Julia Flores", "julia.flores@email.com", "Overdue", 20, 2),
  createInvoice("inv-11", "bk-17", "loc-2", "Kevin Desai", "kevin.desai@email.com", "Sent", 4, 4, { merch: true }),
  createInvoice("inv-12", "bk-18", "loc-2", "Lauren O'Brien", "lauren.obrien@email.com", "Draft", 0, 8, { photo: true, video: true }),
  createInvoice("inv-13", "bk-6", "loc-1", "Mike Huang", "mike.huang@email.com", "Paid", 15, 3),
  createInvoice("inv-14", "bk-7", "loc-1", "Nancy Petrova", "nancy.petrova@email.com", "Void", 25, 4, { photo: true }),
  createInvoice("inv-15", "bk-19", "loc-2", "Oliver West", "oliver.west@email.com", "Paid", 6, 2, { merch: true }),
]

// ============================================================
// NOTIFICATIONS
// ============================================================
export const initialNotifications: Notification[] = [
  { id: "notif-1", type: "overbooked", title: "Overbooked slot at 10:20", description: "Skyline Ridge has 14/12 guests booked for the 10:20 AM slot today.", timestamp: format(subDays(today, 0), "yyyy-MM-dd'T'HH:mm:ss"), read: false },
  { id: "notif-2", type: "waiver", title: "3 waivers outstanding", description: "Guests on the 11:00 AM departure still have unsigned waivers.", timestamp: format(subDays(today, 0), "yyyy-MM-dd'T'HH:mm:ss"), read: false },
  { id: "notif-3", type: "certificate", title: "Expired certificate: Jake Torres", description: "First Aid/CPR certification expired 5 days ago.", timestamp: format(subDays(today, 0), "yyyy-MM-dd'T'HH:mm:ss"), read: false },
  { id: "notif-4", type: "maintenance", title: "Maintenance task overdue", description: "Trolley T-009 brake replacement was due 2 days ago.", timestamp: format(subDays(today, 1), "yyyy-MM-dd'T'08:00:00"), read: true },
  { id: "notif-5", type: "payment", title: "Invoice overdue: Diana Pham", description: "INV-4 for $267.00 is 4 days past due.", timestamp: format(subDays(today, 1), "yyyy-MM-dd'T'10:00:00"), read: true },
  { id: "notif-6", type: "general", title: "Canyon Creek weather alert", description: "High winds expected Friday - review departure schedule.", timestamp: format(subDays(today, 2), "yyyy-MM-dd'T'14:00:00"), read: true },
]

// ============================================================
// SOCIAL MEDIA / CONTENT HUB
// ============================================================
const photoDescriptions = [
  "Guest launching off Platform 1", "Group photo at starting platform", "Mid-flight action shot",
  "Landing zone celebration", "Sunset view from tower", "Guide safety briefing demo",
  "Family group pre-tour", "GoPro selfie mid-zip", "Canyon Creek panorama",
  "Kids adventure tour group", "Night zip lighting setup", "Harness check close-up",
  "Team building corporate group", "Bridal party zipline", "Spring wildflower backdrop",
  "Fall foliage aerial shot", "Rain or shine action", "Double zip racing",
  "Guide pointing out wildlife", "End-of-tour group shot",
]

const tagOptions = ["action-shot", "group", "scenic", "families", "corporate", "celebration", "gopro", "seasonal", "wildlife", "sunset"]

export const siteMediaLibrary: SiteMedia[] = Array.from({ length: 24 }, (_, i) => ({
  id: `media-${i + 1}`,
  locationId: i < 14 ? "loc-1" : "loc-2",
  type: (i % 5 === 0 ? "Video" : i % 7 === 0 ? "GoPro" : "Photo") as SiteMedia["type"],
  source: "On-site" as const,
  url: `https://picsum.photos/seed/zipline${i + 1}/800/600`,
  thumbnailUrl: `https://picsum.photos/seed/zipline${i + 1}/400/300`,
  capturedDate: format(subDays(today, Math.floor(rng() * 30)), "yyyy-MM-dd"),
  tourSlotTime: `${9 + (i % 8)}:${i % 2 === 0 ? "00" : "20"}`,
  guideName: ["Sarah Chen", "Marcus Williams", "Mia Kowalski", "Tyler Grant"][i % 4],
  tags: [tagOptions[i % tagOptions.length], tagOptions[(i + 3) % tagOptions.length]],
  favorited: i % 3 === 0,
  usedInPost: i % 5 === 0,
}))

const igUsernames = [
  "adventure_seekerz", "mountain_mel", "zipline_junkie", "the_travel_fam",
  "adrenaline_anna", "hiking.hank", "wild_weekend_crew", "nature_nut_nick",
  "southern_summits", "carolina_climber", "peak_pursuer", "treetop_tina",
]

const ugcCaptions = [
  "Best day ever at Skyline Ridge! The views are INSANE from up there",
  "Finally checked this off my bucket list! 10/10 would recommend",
  "Our family had the best time - even grandma went!",
  "The guides are so friendly and professional. Felt safe the whole time!",
  "Nothing beats the rush of flying through the mountains",
  "Corporate team building done RIGHT. Everyone loved it!",
  "Birthday adventure at Canyon Creek! Made memories for a lifetime",
  "If you haven't tried this you're missing out. Pure adrenaline!",
  "Gorgeous fall colors from 200ft up? Yes please!",
  "Third time here and it never gets old. Bringing more friends next time",
  "The GoPro footage turned out amazing! Check my stories for the full video",
  "My kids won't stop talking about their zipline adventure",
]

export const ugcPosts: UGCPost[] = igUsernames.map((username, i) => ({
  id: `ugc-${i + 1}`,
  platform: (i % 5 === 0 ? "TikTok" : i % 8 === 0 ? "Google Review" : "Instagram") as UGCPost["platform"],
  username,
  displayName: username.replace(/[_.]/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
  avatarUrl: `https://api.dicebear.com/8.x/adventurer/svg?seed=${username}`,
  caption: ugcCaptions[i % ugcCaptions.length],
  mediaUrl: `https://picsum.photos/seed/ugc${i + 1}/640/640`,
  likes: Math.floor(rng() * 500) + 50,
  comments: Math.floor(rng() * 60) + 5,
  postedAt: format(subDays(today, Math.floor(rng() * 14)), "yyyy-MM-dd'T'HH:mm:ss"),
  locationId: i < 7 ? "loc-1" : "loc-2",
  status: (i < 4 ? "Approved" : i < 8 ? "Pending" : i < 10 ? "Approved" : "Pending") as UGCPost["status"],
  tags: [tagOptions[i % tagOptions.length]],
}))

export const scheduledPosts: ScheduledPost[] = [
  {
    id: "sp-1", platform: "Instagram", mediaIds: ["media-1", "media-4"],
    caption: "Nothing beats the view from 200 feet up! Ready for your next adventure?",
    hashtags: ["#zipline", "#adventure", "#skylineridge", "#outdoorfun", "#bucketlist"],
    scheduledDate: format(addDays(today, 1), "yyyy-MM-dd"), scheduledTime: "10:00",
    status: "Scheduled", createdAt: format(today, "yyyy-MM-dd"),
  },
  {
    id: "sp-2", platform: "Facebook", mediaIds: ["ugc-2"],
    caption: "Shoutout to @mountain_mel for this incredible shot! Who's joining us this weekend?",
    hashtags: ["#zipline", "#guestphoto", "#canyoncreek", "#weekendvibes"],
    scheduledDate: format(addDays(today, 2), "yyyy-MM-dd"), scheduledTime: "14:00",
    status: "Scheduled", createdAt: format(today, "yyyy-MM-dd"),
  },
  {
    id: "sp-3", platform: "All", mediaIds: ["media-6"],
    caption: "Safety first, thrills always! Our certified guides make every flight unforgettable.",
    hashtags: ["#zipline", "#safety", "#adventure", "#guidedtours"],
    scheduledDate: format(addDays(today, 4), "yyyy-MM-dd"), scheduledTime: "11:30",
    status: "Draft", createdAt: format(subDays(today, 1), "yyyy-MM-dd"),
  },
  {
    id: "sp-4", platform: "Instagram", mediaIds: ["media-10", "media-12"],
    caption: "Fall foliage from above - there's nothing quite like it! Book your autumn adventure now.",
    hashtags: ["#fallcolors", "#zipline", "#autumnadventure", "#mountainviews"],
    scheduledDate: format(addDays(today, 7), "yyyy-MM-dd"), scheduledTime: "09:00",
    status: "Draft", createdAt: format(subDays(today, 2), "yyyy-MM-dd"),
  },
]
