// ============================================================
// Zipline Operator OS - Type Definitions
// ============================================================

export interface Location {
  id: string
  name: string
  address: string
  capacity: number // per departure
  operatingHoursStart: string // "08:00"
  operatingHoursEnd: string // "17:00"
  slotInterval: number // 20 minutes
}

export type StaffRole = "Lead Guide" | "Guide" | "Ground Crew" | "Check-in Attendant" | "Manager" | "Admin"

export interface Staff {
  id: string
  name: string
  email: string
  role: StaffRole
  locationId: string
  avatar?: string
  phone: string
  availability?: DayOfWeek[] // days they're available; undefined = all operating days
}

export type DayOfWeek = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"

export interface StaffAssignment {
  staffId: string
  role: StaffRole
  shiftStart: string // "HH:mm"
  shiftEnd: string   // "HH:mm"
}

export interface DailyStaffSchedule {
  id: string
  locationId: string
  date: string // "YYYY-MM-DD"
  status: "Draft" | "Published"
  assignments: StaffAssignment[]
  totalGuests: number
  totalSlots: number
  peakSlotGuests: number
  isWeekend: boolean
  isHoliday: boolean
  holidayName?: string
  notes: string
}

export interface TimeSlot {
  id: string
  locationId: string
  date: string // "YYYY-MM-DD"
  time: string // "HH:mm"
  capacity: number
  bookedCount: number
  status: "Open" | "Filling" | "Full" | "Closed"
  assignedStaffIds: string[]
}

export interface Booking {
  id: string
  locationId: string
  slotId: string
  date: string
  time: string
  contactName: string
  contactEmail: string
  contactPhone: string
  partySize: number
  status: "Confirmed" | "Pending" | "Cancelled" | "Completed" | "No-show"
  paymentStatus: "Paid" | "Pending" | "Refunded" | "Partial"
  notes: string
  createdAt: string
  guests: BookingGuest[]
}

export interface BookingGuest {
  id: string
  bookingId: string
  name: string
  age: number
  isMinor: boolean
  guardianGuestId?: string
  waiverStatus: "Signed" | "Covered" | "Outstanding" | "Sent"
  checkedIn: boolean
  weight?: number // lbs, captured at check-in
  email?: string
  phone?: string
}

export interface Campaign {
  id: string
  name: string
  channel: "GA4" | "Google Ads" | "Meta Ads"
  status: "Active" | "Paused" | "Ended"
  spend: number
  revenue: number
  roas: number
  cpl: number
  impressions: number
  clicks: number
  leads: number
  bookings: number
  startDate: string
  endDate?: string
  platformUrl?: string
}

export interface Lead {
  id: string
  name: string
  email: string
  phone: string
  source: string
  status: "New" | "Contacted" | "Qualified" | "Won" | "Lost"
  locationId: string
  createdAt: string
  notes: LeadNote[]
  value?: number
}

export interface LeadNote {
  id: string
  text: string
  createdAt: string
  author: string
}

export interface NurtureSequence {
  id: string
  name: string
  description: string
  trigger: string
  status: "Active" | "Draft" | "Paused"
  steps: NurtureStep[]
  metrics: {
    enrolled: number
    openRate: number
    clickRate: number
    replyRate: number
    conversionRate: number
  }
}

export interface NurtureStep {
  id: string
  type: "Email" | "SMS" | "Wait" | "Condition"
  subject?: string
  body?: string
  waitDays?: number
  conditionField?: string
  conditionValue?: string
}

export interface EquipmentItem {
  id: string
  category: EquipmentCategory
  name: string
  serialNumber: string
  manufacturer: string
  model: string
  locationId: string
  purchaseDate: string
  inServiceDate: string
  status: "Active" | "Quarantined" | "Retired"
  condition: "Good" | "Watch" | "Replace"
  lastInspectionDate: string
  retireByDate?: string // "YYYY-MM-DD" - mandatory retirement date
  notes: string
  }

export type EquipmentCategory =
  | "Harnesses"
  | "Trolleys"
  | "Helmets"
  | "Lanyards"
  | "Carabiners"
  | "Brakes"
  | "Tower Components"

export interface Inspection {
  id: string
  equipmentId: string
  inspectorId: string
  date: string
  type: "Routine" | "Pre-use" | "Annual"
  overallResult: "Pass" | "Needs Adjustment" | "Fail"
  checklist: InspectionChecklistItem[]
  notes: string
  photos: string[]
}

export interface InspectionChecklistItem {
  id: string
  label: string
  result: "Pass" | "Needs Adjustment" | "Fail"
  notes?: string
}

export interface MaintenanceTask {
  id: string
  equipmentId: string
  inspectionId?: string
  title: string
  description: string
  status: "Open" | "In Progress" | "Waiting Parts" | "Completed" | "Verified"
  priority: "Low" | "Medium" | "High" | "Critical"
  assignedToId?: string
  createdAt: string
  completedAt?: string
  partsUsed: string[]
  laborNotes: string
}

export interface Resource {
  id: string
  title: string
  description: string
  type: "Manual" | "Document" | "Video" | "Link"
  url?: string
  category: string
  tags: string[]
  createdAt: string
}

export interface Certificate {
  id: string
  staffId: string
  type: string
  issueDate: string
  expiryDate: string
  status: "Valid" | "Expiring Soon" | "Expired"
  documentUrl?: string
}

export interface FAQItem {
  id: string
  question: string
  answer: string
  category: string
  tags: string[]
  published: boolean
  usedByAI: boolean
  createdAt: string
}

export interface Integration {
  id: string
  name: string
  type: string
  status: "Connected" | "Disconnected" | "Error"
  lastSync?: string
  icon: string
}

export interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  sources?: string[]
  timestamp: string
}

export interface Invoice {
  id: string
  bookingId: string
  locationId: string
  contactName: string
  contactEmail: string
  amount: number
  tax: number
  total: number
  status: "Draft" | "Sent" | "Paid" | "Overdue" | "Void"
  issuedDate: string
  dueDate: string
  paidDate?: string
  lineItems: InvoiceLineItem[]
  notes: string
}

export interface InvoiceLineItem {
  id: string
  description: string
  quantity: number
  unitPrice: number
  total: number
}

export interface Notification {
  id: string
  type: "overbooked" | "waiver" | "certificate" | "maintenance" | "payment" | "general"
  title: string
  description: string
  timestamp: string
  read: boolean
}

export type MediaType = "Photo" | "Video" | "GoPro"
export type MediaSource = "On-site" | "Instagram" | "TikTok" | "Google Review" | "Manual Upload"

export interface SiteMedia {
  id: string
  locationId: string
  type: MediaType
  source: MediaSource
  url: string // placeholder image URL
  thumbnailUrl: string
  capturedDate: string // "YYYY-MM-DD"
  tourSlotTime?: string // "HH:mm"
  guideName?: string
  tags: string[]
  favorited: boolean
  usedInPost: boolean
}

export interface UGCPost {
  id: string
  platform: "Instagram" | "TikTok" | "Google Review"
  username: string
  displayName: string
  avatarUrl: string
  caption: string
  mediaUrl: string
  likes: number
  comments: number
  postedAt: string // ISO datetime
  locationId: string
  status: "Pending" | "Approved" | "Rejected"
  tags: string[]
}

export interface ScheduledPost {
  id: string
  platform: "Instagram" | "Facebook" | "TikTok" | "All"
  mediaIds: string[] // SiteMedia or UGC ids
  caption: string
  hashtags: string[]
  scheduledDate: string // "YYYY-MM-DD"
  scheduledTime: string // "HH:mm"
  status: "Draft" | "Scheduled" | "Published"
  createdAt: string
}

export interface OpsAlert {
  id: string
  type: "overbooked" | "missing-staff" | "waiver-gap" | "equipment" | "certificate"
  severity: "info" | "warning" | "critical"
  title: string
  description: string
  slotId?: string
  timestamp: string
}

export interface TimelineEvent {
  id: string
  date: string
  type: string
  title: string
  description: string
  result?: string
}
