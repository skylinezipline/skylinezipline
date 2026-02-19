"use client"

import type {
  Booking, EquipmentItem, Inspection, MaintenanceTask,
  Invoice, Certificate, Staff, FAQItem, Lead,
} from "./types"
import { locations, staff, timeSlots, certificates } from "./mock-data"
import { parseISO, differenceInDays, format } from "date-fns"

// ============================================================
// ORACLE ENGINE - Full Internal Ops Data Access
// ============================================================

export interface OracleContext {
  selectedLocationId: string
  bookings: Booking[]
  equipment: EquipmentItem[]
  inspections: Inspection[]
  maintenance: MaintenanceTask[]
  invoices: Invoice[]
  faqItems: FAQItem[]
  leads: Lead[]
}

export interface OracleResponse {
  answer: string
  data?: { label: string; value: string | number }[]
  sources: { title: string; type: "Bookings" | "Equipment" | "Inspections" | "Maintenance" | "Invoices" | "Staff" | "FAQ" | "Schedule" | "Leads" | "Certificates" }[]
  deepLink?: string
  severity?: "info" | "warning" | "critical"
}

const today = new Date()
const todayStr = format(today, "yyyy-MM-dd")

function locationName(id: string) {
  return locations.find(l => l.id === id)?.name || id
}

function staffName(id: string) {
  return staff.find(s => s.id === id)?.name || "Unknown"
}

export function queryOracle(input: string, ctx: OracleContext): OracleResponse {
  const q = input.toLowerCase().trim()
  const loc = ctx.selectedLocationId
  const locBookings = ctx.bookings.filter(b => b.locationId === loc)
  const locEquipment = ctx.equipment.filter(e => e.locationId === loc)
  const locInvoices = ctx.invoices.filter(i => i.locationId === loc)
  const locMaintenance = ctx.maintenance
  const locInspections = ctx.inspections
  const locStaff = staff.filter(s => s.locationId === loc)
  const locCerts = certificates.filter(c => locStaff.some(s => s.id === c.staffId))

  // ---- BOOKINGS / TODAY ----
  if (q.includes("today") && (q.includes("booking") || q.includes("guest") || q.includes("tour"))) {
    const todayBookings = locBookings.filter(b => b.date === todayStr && b.status !== "Cancelled")
    const totalGuests = todayBookings.reduce((s, b) => s + b.partySize, 0)
    const waiversOutstanding = todayBookings.flatMap(b => b.guests).filter(g => g.waiverStatus === "Outstanding").length
    return {
      answer: `${locationName(loc)} has ${todayBookings.length} bookings today with ${totalGuests} total guests. ${waiversOutstanding > 0 ? `${waiversOutstanding} waiver(s) are still outstanding.` : "All waivers are accounted for."}`,
      data: [
        { label: "Bookings", value: todayBookings.length },
        { label: "Guests", value: totalGuests },
        { label: "Waivers Outstanding", value: waiversOutstanding },
      ],
      sources: [{ title: "Today's Bookings", type: "Bookings" }],
      deepLink: "/ops/schedule",
      severity: waiversOutstanding > 0 ? "warning" : "info",
    }
  }

  // ---- BOOKINGS GENERAL / UPCOMING ----
  if (q.includes("booking") || q.includes("reservation")) {
    const upcoming = locBookings.filter(b => b.date >= todayStr && b.status !== "Cancelled")
    const confirmed = upcoming.filter(b => b.status === "Confirmed").length
    const pending = upcoming.filter(b => b.status === "Pending").length
    return {
      answer: `There are ${upcoming.length} upcoming bookings at ${locationName(loc)}: ${confirmed} confirmed, ${pending} pending. Total guests expected: ${upcoming.reduce((s, b) => s + b.partySize, 0)}.`,
      data: [
        { label: "Total Upcoming", value: upcoming.length },
        { label: "Confirmed", value: confirmed },
        { label: "Pending", value: pending },
      ],
      sources: [{ title: "Booking Registry", type: "Bookings" }],
      deepLink: "/ops/bookings",
    }
  }

  // ---- REVENUE / PAYMENTS ----
  if (q.includes("revenue") || q.includes("payment") || q.includes("invoice") || q.includes("money") || q.includes("collect")) {
    const paid = locInvoices.filter(i => i.status === "Paid")
    const overdue = locInvoices.filter(i => i.status === "Overdue")
    const totalCollected = paid.reduce((s, i) => s + i.total, 0)
    const totalOutstanding = locInvoices.filter(i => i.status === "Sent" || i.status === "Overdue").reduce((s, i) => s + i.total, 0)
    return {
      answer: `${locationName(loc)} has collected $${totalCollected.toLocaleString()} from ${paid.length} paid invoices. Outstanding balance: $${totalOutstanding.toLocaleString()} across ${overdue.length} overdue and ${locInvoices.filter(i => i.status === "Sent").length} sent invoices.`,
      data: [
        { label: "Total Collected", value: `$${totalCollected.toLocaleString()}` },
        { label: "Outstanding", value: `$${totalOutstanding.toLocaleString()}` },
        { label: "Overdue Invoices", value: overdue.length },
      ],
      sources: [{ title: "Invoice Ledger", type: "Invoices" }],
      deepLink: "/ops/payments",
      severity: overdue.length > 0 ? "warning" : "info",
    }
  }

  // ---- EQUIPMENT STATUS ----
  if (q.includes("equipment") || q.includes("harness") || q.includes("trolley") || q.includes("helmet") || q.includes("gear")) {
    const active = locEquipment.filter(e => e.status === "Active").length
    const quarantined = locEquipment.filter(e => e.status === "Quarantined").length
    const retired = locEquipment.filter(e => e.status === "Retired").length
    const watchItems = locEquipment.filter(e => e.condition === "Watch" || e.condition === "Replace")
    return {
      answer: `${locationName(loc)} has ${locEquipment.length} equipment items: ${active} active, ${quarantined} quarantined, ${retired} retired. ${watchItems.length > 0 ? `${watchItems.length} item(s) flagged as Watch/Replace condition: ${watchItems.slice(0, 3).map(e => e.serialNumber).join(", ")}${watchItems.length > 3 ? "..." : ""}.` : "All active items are in good condition."}`,
      data: [
        { label: "Active", value: active },
        { label: "Quarantined", value: quarantined },
        { label: "Watch/Replace", value: watchItems.length },
      ],
      sources: [{ title: "Equipment Inventory", type: "Equipment" }],
      deepLink: "/admin/equipment-inventory",
      severity: quarantined > 0 ? "warning" : "info",
    }
  }

  // ---- INSPECTIONS ----
  if (q.includes("inspection") || q.includes("inspect")) {
    const recent = locInspections.slice(-10)
    const failures = recent.filter(i => i.overallResult === "Fail")
    const adjustments = recent.filter(i => i.overallResult === "Needs Adjustment")
    return {
      answer: `Last 10 inspections: ${recent.filter(i => i.overallResult === "Pass").length} passed, ${adjustments.length} need adjustment, ${failures.length} failed. ${failures.length > 0 ? "Failed items have auto-generated maintenance tasks." : "No critical issues found."}`,
      data: [
        { label: "Pass", value: recent.filter(i => i.overallResult === "Pass").length },
        { label: "Needs Adjustment", value: adjustments.length },
        { label: "Fail", value: failures.length },
      ],
      sources: [{ title: "Inspection Records", type: "Inspections" }],
      deepLink: "/admin/inspections",
      severity: failures.length > 0 ? "critical" : "info",
    }
  }

  // ---- MAINTENANCE ----
  if (q.includes("maintenance") || q.includes("repair") || q.includes("fix")) {
    const open = locMaintenance.filter(m => m.status === "Open")
    const inProgress = locMaintenance.filter(m => m.status === "In Progress")
    const critical = locMaintenance.filter(m => m.priority === "Critical" && m.status !== "Completed" && m.status !== "Verified")
    return {
      answer: `Current maintenance: ${open.length} open, ${inProgress.length} in progress, ${locMaintenance.filter(m => m.status === "Waiting Parts").length} waiting parts. ${critical.length > 0 ? `${critical.length} CRITICAL task(s) require immediate attention: ${critical.slice(0, 2).map(m => m.title).join("; ")}.` : "No critical tasks pending."}`,
      data: [
        { label: "Open", value: open.length },
        { label: "In Progress", value: inProgress.length },
        { label: "Critical", value: critical.length },
      ],
      sources: [{ title: "Maintenance Queue", type: "Maintenance" }],
      deepLink: "/admin/maintenance",
      severity: critical.length > 0 ? "critical" : "info",
    }
  }

  // ---- STAFF ----
  if (q.includes("staff") || q.includes("team") || q.includes("employee") || q.includes("who")) {
    const roles = locStaff.reduce((acc, s) => { acc[s.role] = (acc[s.role] || 0) + 1; return acc }, {} as Record<string, number>)
    const roleStr = Object.entries(roles).map(([r, c]) => `${c} ${r}${c > 1 ? "s" : ""}`).join(", ")
    return {
      answer: `${locationName(loc)} has ${locStaff.length} team members: ${roleStr}. Managers: ${locStaff.filter(s => s.role === "Manager").map(s => s.name).join(", ")}.`,
      data: Object.entries(roles).map(([r, c]) => ({ label: r, value: c })),
      sources: [{ title: "Staff Registry", type: "Staff" }],
      deepLink: "/admin/org",
    }
  }

  // ---- CERTIFICATES ----
  if (q.includes("cert") || q.includes("license") || q.includes("expir")) {
    const expiring = locCerts.filter(c => c.status === "Expiring Soon")
    const expired = locCerts.filter(c => c.status === "Expired")
    return {
      answer: `Certificate status for ${locationName(loc)}: ${locCerts.filter(c => c.status === "Valid").length} valid, ${expiring.length} expiring soon, ${expired.length} expired. ${expired.length > 0 ? `Expired: ${expired.map(c => `${staffName(c.staffId)} (${c.type})`).join(", ")}.` : "All critical certifications are current."}`,
      data: [
        { label: "Valid", value: locCerts.filter(c => c.status === "Valid").length },
        { label: "Expiring Soon", value: expiring.length },
        { label: "Expired", value: expired.length },
      ],
      sources: [{ title: "Certificate Tracker", type: "Certificates" }],
      deepLink: "/admin/certificates",
      severity: expired.length > 0 ? "critical" : expiring.length > 0 ? "warning" : "info",
    }
  }

  // ---- WAIVER ----
  if (q.includes("waiver")) {
    const upcoming = locBookings.filter(b => b.date >= todayStr && b.status !== "Cancelled")
    const allGuests = upcoming.flatMap(b => b.guests)
    const signed = allGuests.filter(g => g.waiverStatus === "Signed" || g.waiverStatus === "Covered").length
    const outstanding = allGuests.filter(g => g.waiverStatus === "Outstanding").length
    const sent = allGuests.filter(g => g.waiverStatus === "Sent").length
    return {
      answer: `Waiver status across upcoming bookings: ${signed} signed/covered, ${sent} sent (awaiting signature), ${outstanding} outstanding. ${outstanding > 0 ? "Consider sending reminders for outstanding waivers." : "Great - all waivers are in progress or complete."}`,
      data: [
        { label: "Signed/Covered", value: signed },
        { label: "Sent", value: sent },
        { label: "Outstanding", value: outstanding },
      ],
      sources: [{ title: "Waiver Tracker", type: "Bookings" }],
      deepLink: "/ops/checkin",
      severity: outstanding > 0 ? "warning" : "info",
    }
  }

  // ---- LEADS ----
  if (q.includes("lead") || q.includes("prospect")) {
    const locLeads = ctx.leads.filter(l => l.locationId === loc)
    const newLeads = locLeads.filter(l => l.status === "New").length
    const qualified = locLeads.filter(l => l.status === "Qualified").length
    const won = locLeads.filter(l => l.status === "Won").length
    return {
      answer: `${locationName(loc)} has ${locLeads.length} leads: ${newLeads} new, ${qualified} qualified, ${won} won. Conversion rate: ${locLeads.length > 0 ? Math.round((won / locLeads.length) * 100) : 0}%.`,
      data: [
        { label: "Total Leads", value: locLeads.length },
        { label: "New", value: newLeads },
        { label: "Won", value: won },
      ],
      sources: [{ title: "Lead Pipeline", type: "Leads" }],
      deepLink: "/marketing/leads",
    }
  }

  // ---- SCHEDULE / AVAILABILITY ----
  if (q.includes("schedule") || q.includes("availability") || q.includes("slot") || q.includes("capacity")) {
    const todaySlots = timeSlots.filter(s => s.date === todayStr && s.locationId === loc)
    const openSlots = todaySlots.filter(s => s.status === "Open").length
    const fillingSlots = todaySlots.filter(s => s.status === "Filling").length
    const fullSlots = todaySlots.filter(s => s.status === "Full").length
    const totalCapacity = todaySlots.reduce((s, ts) => s + ts.capacity, 0)
    const totalBooked = todaySlots.reduce((s, ts) => s + ts.bookedCount, 0)
    return {
      answer: `Today's schedule at ${locationName(loc)}: ${todaySlots.length} total slots - ${openSlots} open, ${fillingSlots} filling, ${fullSlots} full. Capacity utilization: ${totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0}% (${totalBooked}/${totalCapacity} spots).`,
      data: [
        { label: "Open Slots", value: openSlots },
        { label: "Filling", value: fillingSlots },
        { label: "Full", value: fullSlots },
        { label: "Utilization", value: `${totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0}%` },
      ],
      sources: [{ title: "Daily Schedule", type: "Schedule" }],
      deepLink: "/ops/schedule",
    }
  }

  // ---- FAQ ----
  if (q.includes("faq") || q.includes("question") || q.includes("asked")) {
    const published = ctx.faqItems.filter(f => f.published).length
    const aiEnabled = ctx.faqItems.filter(f => f.usedByAI).length
    return {
      answer: `FAQ library: ${ctx.faqItems.length} total items, ${published} published, ${aiEnabled} enabled for AI use. Categories: ${[...new Set(ctx.faqItems.map(f => f.category))].join(", ")}.`,
      data: [
        { label: "Total FAQs", value: ctx.faqItems.length },
        { label: "Published", value: published },
        { label: "AI-Enabled", value: aiEnabled },
      ],
      sources: [{ title: "FAQ Database", type: "FAQ" }],
      deepLink: "/ops/faq",
    }
  }

  // ---- OVERVIEW / STATUS / SUMMARY ----
  if (q.includes("overview") || q.includes("summary") || q.includes("status") || q.includes("how") || q.includes("everything")) {
    const todayBookings = locBookings.filter(b => b.date === todayStr && b.status !== "Cancelled")
    const totalGuests = todayBookings.reduce((s, b) => s + b.partySize, 0)
    const outstandingWaivers = todayBookings.flatMap(b => b.guests).filter(g => g.waiverStatus === "Outstanding").length
    const openMaint = locMaintenance.filter(m => m.status === "Open" || m.status === "In Progress").length
    const overdueInvoices = locInvoices.filter(i => i.status === "Overdue").length
    const quarantined = locEquipment.filter(e => e.status === "Quarantined").length
    const expiredCerts = locCerts.filter(c => c.status === "Expired").length

    const issues: string[] = []
    if (outstandingWaivers > 0) issues.push(`${outstandingWaivers} outstanding waiver(s)`)
    if (overdueInvoices > 0) issues.push(`${overdueInvoices} overdue invoice(s)`)
    if (quarantined > 0) issues.push(`${quarantined} quarantined equipment`)
    if (expiredCerts > 0) issues.push(`${expiredCerts} expired cert(s)`)

    return {
      answer: `${locationName(loc)} overview: ${todayBookings.length} bookings today (${totalGuests} guests), ${openMaint} open maintenance tasks. ${issues.length > 0 ? `Action items: ${issues.join(", ")}.` : "No urgent issues - operations running smoothly."}`,
      data: [
        { label: "Today's Bookings", value: todayBookings.length },
        { label: "Guests Expected", value: totalGuests },
        { label: "Open Maintenance", value: openMaint },
        { label: "Action Items", value: issues.length },
      ],
      sources: [
        { title: "Daily Schedule", type: "Schedule" },
        { title: "Maintenance Queue", type: "Maintenance" },
        { title: "Invoice Ledger", type: "Invoices" },
      ],
      severity: issues.length > 2 ? "warning" : "info",
    }
  }

  // ---- DEFAULT / CATCH-ALL ----
  // Try to match a FAQ
  const matchedFaq = ctx.faqItems.find(f =>
    f.published && (
      q.split(" ").some(word => word.length > 3 && f.question.toLowerCase().includes(word)) ||
      f.tags.some(t => q.includes(t.toLowerCase()))
    )
  )
  if (matchedFaq) {
    return {
      answer: matchedFaq.answer,
      sources: [{ title: matchedFaq.question, type: "FAQ" }],
      deepLink: "/ops/faq",
    }
  }

  return {
    answer: `I can help you with information about bookings, revenue, equipment, inspections, maintenance, staff, certificates, waivers, leads, schedules, and FAQs. Try asking something like "How many bookings do we have today?" or "What's the equipment status?" or "Give me an overview."`,
    sources: [],
    severity: "info",
  }
}

// ============================================================
// GUEST-FACING RESPONSES (for embeddable widget)
// ============================================================
export function queryOracleGuest(input: string): OracleResponse {
  const q = input.toLowerCase().trim()

  if (q.includes("age") || q.includes("old") || q.includes("kid") || q.includes("minor") || q.includes("child")) {
    return { answer: "Guests must be at least 10 years old and weigh between 70-275 lbs. Guests under 16 must be accompanied by a parent or guardian who signs the waiver on their behalf.", sources: [{ title: "Age & Weight Requirements", type: "FAQ" }] }
  }
  if (q.includes("wear") || q.includes("cloth") || q.includes("shoe") || q.includes("dress")) {
    return { answer: "Please wear closed-toe shoes (no sandals or flip-flops), comfortable clothing that allows free movement. Remove loose jewelry and tie back long hair. We provide all safety equipment including harnesses and helmets.", sources: [{ title: "What to Wear", type: "FAQ" }] }
  }
  if (q.includes("rain") || q.includes("weather") || q.includes("storm") || q.includes("wind")) {
    return { answer: "Tours operate in light rain - it makes the experience even more exciting! In case of thunderstorms or high winds (>35mph), we will reschedule your tour at no extra charge. We monitor weather conditions continuously and will notify you via text/email.", sources: [{ title: "Weather Policy", type: "FAQ" }] }
  }
  if (q.includes("cancel") || q.includes("refund") || q.includes("reschedule")) {
    return { answer: "Our cancellation policy: Full refund for cancellations 48+ hours before your tour. 50% refund for 24-48 hours notice. Less than 24 hours: no refund, but we always offer free rescheduling. Weather-related cancellations are always fully refunded.", sources: [{ title: "Cancellation Policy", type: "FAQ" }] }
  }
  if (q.includes("price") || q.includes("cost") || q.includes("how much") || q.includes("rate")) {
    return { answer: "Standard zipline tours start at $79-$89 per person depending on location. We offer group discounts for parties of 8+, and corporate/team-building packages. Photo packages ($45) and GoPro video add-ons ($25/person) are also available.", sources: [{ title: "Pricing", type: "FAQ" }] }
  }
  if (q.includes("long") || q.includes("duration") || q.includes("time") || q.includes("hour")) {
    return { answer: "The full zipline tour experience takes approximately 2-2.5 hours, including safety briefing, gear-up, and the tour itself. The actual ziplining portion is about 1.5 hours across multiple lines. Please arrive 15 minutes before your scheduled time.", sources: [{ title: "Tour Duration", type: "FAQ" }] }
  }
  if (q.includes("book") || q.includes("reserv") || q.includes("sign up") || q.includes("ticket")) {
    return { answer: "You can book online through our website or call us directly. We recommend booking at least 48 hours in advance, especially for weekends and holidays. A deposit may be required for large groups (8+).", sources: [{ title: "How to Book", type: "FAQ" }] }
  }
  if (q.includes("safe") || q.includes("danger") || q.includes("risk") || q.includes("scar")) {
    return { answer: "Safety is our top priority. All equipment is inspected daily, guides are certified and trained in first aid, and we follow ACCT (Association for Challenge Course Technology) standards. Our courses are engineered by certified professionals and undergo annual third-party inspections.", sources: [{ title: "Safety Standards", type: "FAQ" }] }
  }
  if (q.includes("weight") || q.includes("heavy") || q.includes("weigh")) {
    return { answer: "Participants must weigh between 70 lbs (32 kg) and 275 lbs (125 kg). All guests are weighed during check-in for safety equipment fitting. Weight requirements ensure proper braking and line performance.", sources: [{ title: "Weight Requirements", type: "FAQ" }] }
  }
  if (q.includes("location") || q.includes("where") || q.includes("address") || q.includes("direction")) {
    return { answer: "We have two locations: Skyline Ridge at 1200 Ridge Crest Trail, Asheville, NC 28801, and Canyon Creek at 450 Canyon Road, Gatlinburg, TN 37738. Both locations offer free parking and are easily accessible.", sources: [{ title: "Locations", type: "FAQ" }] }
  }
  if (q.includes("waiver") || q.includes("sign")) {
    return { answer: "All participants must complete a digital waiver before the tour. You will receive a waiver link via email after booking. Guests under 16 must have a parent or guardian sign on their behalf. You can also complete the waiver on-site at check-in.", sources: [{ title: "Waiver Information", type: "FAQ" }] }
  }

  return {
    answer: "I can help you with questions about our zipline tours! Ask me about pricing, age/weight requirements, what to wear, weather policies, cancellations, safety, booking, locations, or tour duration.",
    sources: [],
  }
}
