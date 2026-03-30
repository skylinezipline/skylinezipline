"use client"

import React, { createContext, useContext, useReducer, useEffect, useCallback, type ReactNode } from "react"
import { toast } from "sonner"
import type {
  Booking, BookingGuest, Lead, LeadNote, EquipmentItem,
  Inspection, MaintenanceTask, FAQItem, Invoice, Notification,
  DailyStaffSchedule, StaffAssignment, SiteMedia, UGCPost, ScheduledPost,
} from "./types"

// ============================================================
// STATE
// ============================================================
interface AppState {
  selectedLocationId: string
  bookings: Booking[]
  leads: Lead[]
  equipment: EquipmentItem[]
  inspections: Inspection[]
  maintenance: MaintenanceTask[]
  faqItems: FAQItem[]
  invoices: Invoice[]
  notifications: Notification[]
  staffSchedules: DailyStaffSchedule[]
  siteMedia: SiteMedia[]
  ugcPosts: UGCPost[]
  scheduledPosts: ScheduledPost[]
  isLoaded: boolean
}

const initialState: AppState = {
  selectedLocationId: "",
  bookings: [],
  leads: [],
  equipment: [],
  inspections: [],
  maintenance: [],
  faqItems: [],
  invoices: [],
  notifications: [],
  staffSchedules: [],
  siteMedia: [],
  ugcPosts: [],
  scheduledPosts: [],
  isLoaded: false,
}

// ============================================================
// ACTIONS
// ============================================================
type Action =
  | { type: "SET_LOCATION"; locationId: string }
  | { type: "LOAD_DATA"; data: Partial<AppState> }
  | { type: "ADD_BOOKING"; booking: Booking }
  | { type: "UPDATE_BOOKING"; id: string; updates: Partial<Booking> }
  | { type: "CHECK_IN_GUEST"; bookingId: string; guestId: string; weight?: number }
  | { type: "BULK_CHECK_IN"; bookingId: string; guestIds: string[] }
  | { type: "UPDATE_GUEST"; bookingId: string; guestId: string; updates: Partial<BookingGuest> }
  | { type: "BLOCK_SLOT"; slotId: string }
  | { type: "UPDATE_LEAD_STATUS"; id: string; status: Lead["status"] }
  | { type: "ADD_LEAD"; lead: Lead }
  | { type: "DELETE_LEADS"; ids: string[] }
  | { type: "BULK_UPDATE_LEAD_STATUS"; ids: string[]; status: Lead["status"] }
  | { type: "BULK_UPDATE_LEAD_LOCATION"; ids: string[]; locationId: string }
  | { type: "ADD_LEAD_NOTE"; leadId: string; note: LeadNote }
  | { type: "ADD_EQUIPMENT"; item: EquipmentItem }
  | { type: "UPDATE_EQUIPMENT"; id: string; updates: Partial<EquipmentItem> }
  | { type: "ADD_INSPECTION"; inspection: Inspection }
  | { type: "ADD_MAINTENANCE"; task: MaintenanceTask }
  | { type: "UPDATE_MAINTENANCE"; id: string; updates: Partial<MaintenanceTask> }
  | { type: "ADD_FAQ"; item: FAQItem }
  | { type: "UPDATE_FAQ"; id: string; updates: Partial<FAQItem> }
  | { type: "UPDATE_GUEST_WAIVER"; bookingId: string; guestId: string; status: BookingGuest["waiverStatus"] }
  | { type: "LINK_MINOR_GUARDIAN"; bookingId: string; minorGuestId: string; guardianGuestId: string }
  | { type: "ADD_INVOICE"; invoice: Invoice }
  | { type: "UPDATE_INVOICE"; id: string; updates: Partial<Invoice> }
  | { type: "DISMISS_NOTIFICATION"; id: string }
  | { type: "MARK_NOTIFICATION_READ"; id: string }
  | { type: "CLEAR_READ_NOTIFICATIONS" }
  | { type: "SET_STAFF_SCHEDULES"; schedules: DailyStaffSchedule[] }
  | { type: "UPDATE_STAFF_SCHEDULE"; id: string; updates: Partial<DailyStaffSchedule> }
  | { type: "ADD_ASSIGNMENT"; scheduleId: string; assignment: StaffAssignment }
  | { type: "REMOVE_ASSIGNMENT"; scheduleId: string; staffId: string }
  | { type: "REPLACE_ASSIGNMENT"; scheduleId: string; oldStaffId: string; newAssignment: StaffAssignment }
  | { type: "TOGGLE_MEDIA_FAVORITE"; id: string }
  | { type: "UPDATE_UGC_STATUS"; id: string; status: UGCPost["status"] }
  | { type: "ADD_SCHEDULED_POST"; post: ScheduledPost }
  | { type: "UPDATE_SCHEDULED_POST"; id: string; updates: Partial<ScheduledPost> }
  | { type: "DELETE_SCHEDULED_POST"; id: string }

// ============================================================
// REDUCER
// ============================================================
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "SET_LOCATION":
      return { ...state, selectedLocationId: action.locationId }

    case "LOAD_DATA":
      return { ...state, ...action.data, isLoaded: true }

    case "ADD_BOOKING":
      return { ...state, bookings: [...state.bookings, action.booking] }

    case "UPDATE_BOOKING":
      return {
        ...state,
        bookings: state.bookings.map(b =>
          b.id === action.id ? { ...b, ...action.updates } : b
        ),
      }

    case "CHECK_IN_GUEST":
      return {
        ...state,
        bookings: state.bookings.map(b =>
          b.id === action.bookingId
            ? {
                ...b,
                guests: b.guests.map(g =>
                  g.id === action.guestId ? { ...g, checkedIn: true, ...(action.weight ? { weight: action.weight } : {}) } : g
                ),
              }
            : b
        ),
      }

    case "UPDATE_GUEST":
      return {
        ...state,
        bookings: state.bookings.map(b =>
          b.id === action.bookingId
            ? {
                ...b,
                guests: b.guests.map(g =>
                  g.id === action.guestId ? { ...g, ...action.updates } : g
                ),
              }
            : b
        ),
      }

    case "BLOCK_SLOT":
      return state

    case "BULK_CHECK_IN":
      return {
        ...state,
        bookings: state.bookings.map(b =>
          b.id === action.bookingId
            ? {
                ...b,
                guests: b.guests.map(g =>
                  action.guestIds.includes(g.id) ? { ...g, checkedIn: true } : g
                ),
              }
            : b
        ),
      }

    case "UPDATE_LEAD_STATUS":
      return {
        ...state,
        leads: state.leads.map(l =>
          l.id === action.id ? { ...l, status: action.status } : l
        ),
      }

    case "ADD_LEAD":
      return { ...state, leads: [action.lead, ...state.leads] }

    case "DELETE_LEADS":
      return { ...state, leads: state.leads.filter(l => !action.ids.includes(l.id)) }

    case "BULK_UPDATE_LEAD_STATUS":
      return {
        ...state,
        leads: state.leads.map(l =>
          action.ids.includes(l.id) ? { ...l, status: action.status } : l
        ),
      }

    case "BULK_UPDATE_LEAD_LOCATION":
      return {
        ...state,
        leads: state.leads.map(l =>
          action.ids.includes(l.id) ? { ...l, locationId: action.locationId } : l
        ),
      }

    case "ADD_LEAD_NOTE":
      return {
        ...state,
        leads: state.leads.map(l =>
          l.id === action.leadId ? { ...l, notes: [...l.notes, action.note] } : l
        ),
      }

    case "ADD_EQUIPMENT":
      return { ...state, equipment: [...state.equipment, action.item] }

    case "UPDATE_EQUIPMENT":
      return {
        ...state,
        equipment: state.equipment.map(e =>
          e.id === action.id ? { ...e, ...action.updates } : e
        ),
      }

    case "ADD_INSPECTION": {
      let newMaintenance = state.maintenance
      if (action.inspection.overallResult === "Fail" || action.inspection.overallResult === "Needs Adjustment") {
        const equip = state.equipment.find(e => e.id === action.inspection.equipmentId)
        const newTask: MaintenanceTask = {
          id: `mt-auto-${Date.now()}`,
          equipmentId: action.inspection.equipmentId,
          inspectionId: action.inspection.id,
          title: `${action.inspection.overallResult}: ${equip?.serialNumber || action.inspection.equipmentId}`,
          description: `Auto-created from inspection ${action.inspection.id}. ${action.inspection.notes}`,
          status: "Open",
          priority: action.inspection.overallResult === "Fail" ? "Critical" : "Medium",
          createdAt: action.inspection.date,
          partsUsed: [],
          laborNotes: "",
        }
        newMaintenance = [...state.maintenance, newTask]
      }
      return {
        ...state,
        inspections: [...state.inspections, action.inspection],
        maintenance: newMaintenance,
        equipment: state.equipment.map(e =>
          e.id === action.inspection.equipmentId
            ? { ...e, lastInspectionDate: action.inspection.date }
            : e
        ),
      }
    }

    case "ADD_MAINTENANCE":
      return { ...state, maintenance: [...state.maintenance, action.task] }

    case "UPDATE_MAINTENANCE":
      return {
        ...state,
        maintenance: state.maintenance.map(m =>
          m.id === action.id ? { ...m, ...action.updates } : m
        ),
      }

    case "ADD_FAQ":
      return { ...state, faqItems: [...state.faqItems, action.item] }

    case "UPDATE_FAQ":
      return {
        ...state,
        faqItems: state.faqItems.map(f =>
          f.id === action.id ? { ...f, ...action.updates } : f
        ),
      }

    case "UPDATE_GUEST_WAIVER":
      return {
        ...state,
        bookings: state.bookings.map(b =>
          b.id === action.bookingId
            ? {
                ...b,
                guests: b.guests.map(g => {
                  if (g.id === action.guestId) return { ...g, waiverStatus: action.status }
                  if (g.guardianGuestId === action.guestId && action.status === "Signed") return { ...g, waiverStatus: "Covered" }
                  return g
                }),
              }
            : b
        ),
      }

    case "LINK_MINOR_GUARDIAN":
      return {
        ...state,
        bookings: state.bookings.map(b =>
          b.id === action.bookingId
            ? {
                ...b,
                guests: b.guests.map(g => {
                  if (g.id === action.minorGuestId) {
                    const guardian = b.guests.find(gg => gg.id === action.guardianGuestId)
                    return {
                      ...g,
                      guardianGuestId: action.guardianGuestId,
                      isMinor: true,
                      waiverStatus: guardian?.waiverStatus === "Signed" ? "Covered" : "Outstanding",
                    }
                  }
                  return g
                }),
              }
            : b
        ),
      }

    case "ADD_INVOICE":
      return { ...state, invoices: [...state.invoices, action.invoice] }

    case "UPDATE_INVOICE":
      return {
        ...state,
        invoices: state.invoices.map(inv =>
          inv.id === action.id ? { ...inv, ...action.updates } : inv
        ),
      }

    case "DISMISS_NOTIFICATION":
      return { ...state, notifications: state.notifications.filter(n => n.id !== action.id) }

    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.id ? { ...n, read: true } : n
        ),
      }

    case "CLEAR_READ_NOTIFICATIONS":
      return { ...state, notifications: state.notifications.filter(n => !n.read) }

    case "SET_STAFF_SCHEDULES":
      return { ...state, staffSchedules: action.schedules }

    case "UPDATE_STAFF_SCHEDULE":
      return {
        ...state,
        staffSchedules: state.staffSchedules.map(s =>
          s.id === action.id ? { ...s, ...action.updates } : s
        ),
      }

    case "ADD_ASSIGNMENT":
      return {
        ...state,
        staffSchedules: state.staffSchedules.map(s =>
          s.id === action.scheduleId
            ? { ...s, assignments: [...s.assignments, action.assignment] }
            : s
        ),
      }

    case "REMOVE_ASSIGNMENT":
      return {
        ...state,
        staffSchedules: state.staffSchedules.map(s =>
          s.id === action.scheduleId
            ? { ...s, assignments: s.assignments.filter(a => a.staffId !== action.staffId) }
            : s
        ),
      }

    case "REPLACE_ASSIGNMENT":
      return {
        ...state,
        staffSchedules: state.staffSchedules.map(s =>
          s.id === action.scheduleId
            ? {
                ...s,
                assignments: s.assignments.map(a =>
                  a.staffId === action.oldStaffId ? action.newAssignment : a
                ),
              }
            : s
        ),
      }

    case "TOGGLE_MEDIA_FAVORITE":
      return {
        ...state,
        siteMedia: state.siteMedia.map(m =>
          m.id === action.id ? { ...m, favorited: !m.favorited } : m
        ),
      }

    case "UPDATE_UGC_STATUS":
      return {
        ...state,
        ugcPosts: state.ugcPosts.map(p =>
          p.id === action.id ? { ...p, status: action.status } : p
        ),
      }

    case "ADD_SCHEDULED_POST":
      return { ...state, scheduledPosts: [...state.scheduledPosts, action.post] }

    case "UPDATE_SCHEDULED_POST":
      return {
        ...state,
        scheduledPosts: state.scheduledPosts.map(p =>
          p.id === action.id ? { ...p, ...action.updates } : p
        ),
      }

    case "DELETE_SCHEDULED_POST":
      return { ...state, scheduledPosts: state.scheduledPosts.filter(p => p.id !== action.id) }

    default:
      return state
  }
}

// ============================================================
// API HELPERS
// ============================================================
async function apiFetch(url: string, options?: RequestInit) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  })
  if (!res.ok) throw new Error(`API error: ${res.status}`)
  return res.json()
}

// Map enum values from DB format to app format
function mapBooking(b: any): Booking {
  return {
    ...b,
    status: b.status?.replace("_", "-") ?? b.status,
    paymentStatus: b.paymentStatus?.replace("_", "-") ?? b.paymentStatus,
    guests: (b.guests ?? []).map((g: any) => ({
      ...g,
      waiverStatus: g.waiverStatus?.charAt(0) + g.waiverStatus?.slice(1).toLowerCase().replace("_", " ") ?? g.waiverStatus,
    })),
  }
}

// ============================================================
// CONTEXT
// ============================================================
const AppContext = createContext<{
  state: AppState
  dispatch: (action: Action) => void
} | null>(null)

export function AppStoreProvider({ children, locationId }: { children: ReactNode; locationId?: string }) {
  const [state, reducerDispatch] = useReducer(appReducer, {
    ...initialState,
    selectedLocationId: locationId ?? "",
  })

  // Load all data from API on mount
  useEffect(() => {
    async function loadData() {
      try {
        const locId = locationId ?? ""
        const qs = locId ? `?locationId=${locId}` : ""

        const [
          bookingsRaw, leads, equipment, inspections,
          maintenance, faqItems, invoices, notifications,
          staffSchedules, siteMedia, ugcPosts, scheduledPosts,
        ] = await Promise.allSettled([
          apiFetch(`/api/bookings${qs}`),
          apiFetch(`/api/leads${qs}`),
          apiFetch(`/api/equipment${qs}`),
          apiFetch(`/api/inspections`),
          apiFetch(`/api/maintenance`),
          apiFetch(`/api/faq${qs}`),
          apiFetch(`/api/invoices${qs}`),
          apiFetch(`/api/notifications`),
          apiFetch(`/api/schedules${qs}`),
          apiFetch(`/api/media${qs}`),
          apiFetch(`/api/ugc${qs}`),
          apiFetch(`/api/scheduled-posts${qs}`),
        ])

        const getValue = (result: PromiseSettledResult<any>, fallback: any[] = []) =>
          result.status === "fulfilled" ? result.value : fallback

        reducerDispatch({
          type: "LOAD_DATA",
          data: {
            bookings: getValue(bookingsRaw).map(mapBooking),
            leads: getValue(leads),
            equipment: getValue(equipment),
            inspections: getValue(inspections),
            maintenance: getValue(maintenance),
            faqItems: getValue(faqItems),
            invoices: getValue(invoices),
            notifications: getValue(notifications),
            staffSchedules: getValue(staffSchedules),
            siteMedia: getValue(siteMedia),
            ugcPosts: getValue(ugcPosts),
            scheduledPosts: getValue(scheduledPosts),
            selectedLocationId: locId,
          },
        })
      } catch {
        // If API fails (e.g. first-time with no data), just mark as loaded
        reducerDispatch({ type: "LOAD_DATA", data: {} })
      }
    }

    loadData()
  }, [locationId])

  // dispatch: optimistic update + API call in background
  const apiDispatch = useCallback(async (action: Action) => {
    // Apply optimistic update immediately
    reducerDispatch(action)

    try {
      switch (action.type) {
        case "ADD_BOOKING": {
          const { guests, ...data } = action.booking as any
          await apiFetch("/api/bookings", { method: "POST", body: JSON.stringify({ ...data, guests }) })
          break
        }
        case "UPDATE_BOOKING":
          await apiFetch(`/api/bookings/${action.id}`, { method: "PATCH", body: JSON.stringify(action.updates) })
          break
        case "CHECK_IN_GUEST":
          await apiFetch(`/api/bookings/${action.bookingId}/guests`, {
            method: "PATCH",
            body: JSON.stringify({ guestId: action.guestId, checkedIn: true, ...(action.weight ? { weight: action.weight } : {}) }),
          })
          break
        case "BULK_CHECK_IN":
          await Promise.all(
            action.guestIds.map(guestId =>
              apiFetch(`/api/bookings/${action.bookingId}/guests`, {
                method: "PATCH",
                body: JSON.stringify({ guestId, checkedIn: true }),
              })
            )
          )
          break
        case "UPDATE_GUEST":
          await apiFetch(`/api/bookings/${action.bookingId}/guests`, {
            method: "PATCH",
            body: JSON.stringify({ guestId: action.guestId, ...action.updates }),
          })
          break
        case "UPDATE_GUEST_WAIVER":
          await apiFetch(`/api/bookings/${action.bookingId}/guests`, {
            method: "PATCH",
            body: JSON.stringify({ guestId: action.guestId, waiverStatus: action.status }),
          })
          break
        case "ADD_LEAD":
          await apiFetch("/api/leads", { method: "POST", body: JSON.stringify(action.lead) })
          break
        case "UPDATE_LEAD_STATUS":
          await apiFetch(`/api/leads/${action.id}`, { method: "PATCH", body: JSON.stringify({ status: action.status }) })
          break
        case "DELETE_LEADS":
          await apiFetch("/api/leads", { method: "DELETE", body: JSON.stringify({ ids: action.ids }) })
          break
        case "BULK_UPDATE_LEAD_STATUS":
          await Promise.all(action.ids.map(id =>
            apiFetch(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify({ status: action.status }) })
          ))
          break
        case "BULK_UPDATE_LEAD_LOCATION":
          await Promise.all(action.ids.map(id =>
            apiFetch(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify({ locationId: action.locationId }) })
          ))
          break
        case "ADD_LEAD_NOTE":
          await apiFetch(`/api/leads/${action.leadId}/notes`, { method: "POST", body: JSON.stringify({ text: action.note.text }) })
          break
        case "ADD_EQUIPMENT":
          await apiFetch("/api/equipment", { method: "POST", body: JSON.stringify(action.item) })
          break
        case "UPDATE_EQUIPMENT":
          await apiFetch(`/api/equipment/${action.id}`, { method: "PATCH", body: JSON.stringify(action.updates) })
          break
        case "ADD_INSPECTION":
          await apiFetch("/api/inspections", { method: "POST", body: JSON.stringify(action.inspection) })
          break
        case "ADD_MAINTENANCE":
          await apiFetch("/api/maintenance", { method: "POST", body: JSON.stringify(action.task) })
          break
        case "UPDATE_MAINTENANCE":
          await apiFetch(`/api/maintenance/${action.id}`, { method: "PATCH", body: JSON.stringify(action.updates) })
          break
        case "ADD_FAQ":
          await apiFetch("/api/faq", { method: "POST", body: JSON.stringify(action.item) })
          break
        case "UPDATE_FAQ":
          await apiFetch(`/api/faq/${action.id}`, { method: "PATCH", body: JSON.stringify(action.updates) })
          break
        case "ADD_INVOICE":
          await apiFetch("/api/invoices", { method: "POST", body: JSON.stringify(action.invoice) })
          break
        case "UPDATE_INVOICE":
          await apiFetch(`/api/invoices/${action.id}`, { method: "PATCH", body: JSON.stringify(action.updates) })
          break
        case "DISMISS_NOTIFICATION":
          await apiFetch(`/api/notifications/${action.id}`, { method: "DELETE" })
          break
        case "MARK_NOTIFICATION_READ":
          await apiFetch("/api/notifications", { method: "PATCH", body: JSON.stringify({ ids: [action.id], read: true }) })
          break
        case "CLEAR_READ_NOTIFICATIONS":
          await apiFetch("/api/notifications", { method: "PATCH", body: JSON.stringify({ read: false }) })
          break
        case "SET_STAFF_SCHEDULES":
          // Bulk set - no direct API call needed (handled by schedules page directly)
          break
        case "UPDATE_STAFF_SCHEDULE":
          await apiFetch(`/api/schedules/${action.id}`, { method: "PATCH", body: JSON.stringify(action.updates) })
          break
        case "TOGGLE_MEDIA_FAVORITE": {
          const item = state.siteMedia.find(m => m.id === action.id)
          if (item) await apiFetch(`/api/media/${action.id}`, { method: "PATCH", body: JSON.stringify({ favorited: !item.favorited }) })
          break
        }
        case "UPDATE_UGC_STATUS":
          await apiFetch(`/api/ugc/${action.id}`, { method: "PATCH", body: JSON.stringify({ status: action.status }) })
          break
        case "ADD_SCHEDULED_POST":
          await apiFetch("/api/scheduled-posts", { method: "POST", body: JSON.stringify(action.post) })
          break
        case "UPDATE_SCHEDULED_POST":
          await apiFetch(`/api/scheduled-posts/${action.id}`, { method: "PATCH", body: JSON.stringify(action.updates) })
          break
        case "DELETE_SCHEDULED_POST":
          await apiFetch(`/api/scheduled-posts/${action.id}`, { method: "DELETE" })
          break
        default:
          // Actions like SET_LOCATION, BLOCK_SLOT, LINK_MINOR_GUARDIAN are local-only
          break
      }
    } catch {
      toast.error("Failed to save changes. Please try again.")
    }
  }, [state.siteMedia, reducerDispatch])

  // Expose apiDispatch as dispatch so all pages automatically persist
  const dispatch = useCallback((action: Action) => { void apiDispatch(action) }, [apiDispatch])

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

export function useAppStore() {
  const context = useContext(AppContext)
  if (!context) throw new Error("useAppStore must be used within AppStoreProvider")
  return context
}
