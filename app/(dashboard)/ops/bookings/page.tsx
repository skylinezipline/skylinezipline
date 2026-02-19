"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Plus, Send, CreditCard, RefreshCw, Copy, Link, Pencil, Check, X, UserPlus } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { WaiverStatusBar } from "@/components/waiver-status-bar"
import { useAppStore } from "@/lib/mock-store"
import { locations, timeSlots } from "@/lib/mock-data"
import type { Booking, BookingGuest } from "@/lib/types"
import { toast } from "sonner"

export default function BookingsPage() {
  const { state, dispatch } = useAppStore()
  const router = useRouter()
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [createStep, setCreateStep] = useState(1) // 1=details, 2=payment, 3=guests

  // Guest editing - full fields
  const [editingGuestId, setEditingGuestId] = useState<string | null>(null)
  const [editGuestName, setEditGuestName] = useState("")
  const [editGuestAge, setEditGuestAge] = useState("")
  const [editGuestEmail, setEditGuestEmail] = useState("")
  const [editGuestPhone, setEditGuestPhone] = useState("")

  // Add guest slot (simplified - just adds an empty slot)
  const [addGuestOpen, setAddGuestOpen] = useState(false)

  const filtered = state.bookings
    .filter(b => b.locationId === state.selectedLocationId)
    .filter(b => statusFilter === "all" || b.status === statusFilter)

  const syncedBooking = useMemo(() => {
    if (!selectedBooking) return null
    return state.bookings.find(b => b.id === selectedBooking.id) || null
  }, [selectedBooking, state.bookings])

  const columns = [
    { key: "id", label: "ID", render: (b: Booking) => <span className="font-mono text-xs">{b.id}</span> },
    { key: "contactName", label: "Contact" },
    { key: "date", label: "Date", render: (b: Booking) => format(parseISO(b.date), "MMM d, yyyy") },
    { key: "time", label: "Time", render: (b: Booking) => <span className="font-mono">{b.time}</span> },
    { key: "partySize", label: "Party", render: (b: Booking) => `${b.partySize} guests` },
    { key: "status", label: "Status", render: (b: Booking) => <StatusBadge status={b.status} /> },
    { key: "paymentStatus", label: "Payment", render: (b: Booking) => <StatusBadge status={b.paymentStatus === "Partial" ? "Pending" : b.paymentStatus === "Refunded" ? "Paid" : b.paymentStatus} /> },
    {
      key: "waivers", label: "Waivers",
      render: (b: Booking) => <WaiverStatusBar guests={b.guests} className="w-20" />,
    },
  ]

  function handleCreateBooking(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const partySize = Number(fd.get("partySize") || 2)
    const contactName = String(fd.get("contactName") || "")
    const contactEmail = String(fd.get("contactEmail") || "")
    const newBooking: Booking = {
      id: `bk-${Date.now()}`,
      locationId: state.selectedLocationId,
      slotId: String(fd.get("slot") || ""),
      date: String(fd.get("date") || "2026-02-14"),
      time: String(fd.get("slot") || "10:00").split("-").pop() || "10:00",
      contactName,
      contactEmail,
      contactPhone: String(fd.get("contactPhone") || ""),
      partySize,
      status: "Confirmed",
      paymentStatus: "Pending",
      notes: String(fd.get("notes") || ""),
      createdAt: new Date().toISOString(),
      guests: Array.from({ length: partySize }, (_, i) => ({
        id: `guest-new-${Date.now()}-${i}`,
        bookingId: `bk-${Date.now()}`,
        name: i === 0 ? contactName : "",
        age: 0,
        isMinor: false,
        waiverStatus: "Outstanding" as const,
        checkedIn: false,
        email: i === 0 ? contactEmail : "",
      })),
    }
    dispatch({ type: "ADD_BOOKING", booking: newBooking })
    setCreateOpen(false)
    setCreateStep(1)
    toast.success("Booking created. Share the group booking link for guest details and waivers.")
  }

  // Waiver flow: send to all Outstanding AND Sent (resend to Sent in case lost)
  const handleSendAllWaivers = () => {
    if (!syncedBooking) return
    const missingEmails = syncedBooking.guests.filter(g =>
      (g.waiverStatus === "Outstanding" || g.waiverStatus === "Sent") && !g.email
    )
    if (missingEmails.length > 0) {
      toast.error(`${missingEmails.length} guest(s) are missing email addresses. Please add emails before sending waivers.`)
      return
    }
    const sendable = syncedBooking.guests.filter(g => g.waiverStatus === "Outstanding" || g.waiverStatus === "Sent")
    sendable.forEach(g => {
      dispatch({ type: "UPDATE_GUEST_WAIVER", bookingId: syncedBooking.id, guestId: g.id, status: "Sent" })
    })
    toast.success(`Waivers sent to ${sendable.length} guest(s)`)
  }

  const getShareLink = () => {
    if (!syncedBooking) return ""
    return `${typeof window !== "undefined" ? window.location.origin : ""}/book/group/${syncedBooking.id}`
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(getShareLink())
    toast.success("Group booking link copied to clipboard")
  }

  // Full guest editing
  const startEditGuest = (g: BookingGuest) => {
    setEditingGuestId(g.id)
    setEditGuestName(g.name)
    setEditGuestAge(String(g.age || ""))
    setEditGuestEmail(g.email || "")
    setEditGuestPhone(g.phone || "")
  }

  const saveEditGuest = () => {
    if (!syncedBooking || !editingGuestId) return
    const age = parseInt(editGuestAge) || 0
    dispatch({
      type: "UPDATE_GUEST",
      bookingId: syncedBooking.id,
      guestId: editingGuestId,
      updates: {
        name: editGuestName.trim(),
        age,
        isMinor: age > 0 && age < 18,
        email: editGuestEmail.trim() || undefined,
        phone: editGuestPhone.trim() || undefined,
      },
    })
    toast.success("Guest updated")
    setEditingGuestId(null)
  }

  // Add guest - simplified: just adds an empty slot
  const handleAddGuestSlot = () => {
    if (!syncedBooking) return
    dispatch({
      type: "UPDATE_BOOKING",
      id: syncedBooking.id,
      updates: {
        guests: [...syncedBooking.guests, {
          id: `guest-${Date.now()}`,
          bookingId: syncedBooking.id,
          name: "",
          age: 0,
          isMinor: false,
          waiverStatus: "Outstanding" as const,
          checkedIn: false,
        }],
        partySize: syncedBooking.partySize + 1,
      },
    })
    toast.success("Guest slot added. Use the group booking link or edit to add details.")
    setAddGuestOpen(false)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bookings</h1>
          <p className="text-muted-foreground">Manage reservations and guest information</p>
        </div>
        <Dialog open={createOpen} onOpenChange={(o) => { setCreateOpen(o); if (!o) setCreateStep(1) }}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Create Booking</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create New Booking</DialogTitle>
              <DialogDescription>
                {createStep === 1 && "Step 1: Booking details"}
                {createStep === 2 && "Step 2: Payment details for cancellation policy (optional)"}
                {createStep === 3 && "Step 3: Guest information (optional - can use group link later)"}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateBooking} className="flex flex-col gap-4">
              {createStep === 1 && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="date">Date</Label>
                      <Input id="date" name="date" type="date" defaultValue="2026-02-14" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="slot">Time Slot</Label>
                      <Select name="slot" defaultValue="10:00">
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {["08:00","08:20","08:40","09:00","09:20","09:40","10:00","10:20","10:40","11:00","11:20","11:40","12:00","12:20","12:40","13:00","13:20","13:40","14:00","14:20","14:40","15:00","15:20","15:40","16:00","16:20","16:40"].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="contactName">Contact Name</Label>
                    <Input id="contactName" name="contactName" required placeholder="Full name" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="contactEmail">Email</Label>
                      <Input id="contactEmail" name="contactEmail" type="email" placeholder="email@example.com" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="contactPhone">Phone</Label>
                      <Input id="contactPhone" name="contactPhone" placeholder="(555) 000-0000" />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="partySize">Party Size</Label>
                    <Input id="partySize" name="partySize" type="number" min={1} max={12} defaultValue={2} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" name="notes" placeholder="Special requests, birthday, etc." />
                  </div>
                </>
              )}
              {createStep === 2 && (
                <div className="flex flex-col gap-4 py-2">
                  <p className="text-sm text-muted-foreground">
                    We have a 24-hour cancellation policy. Collecting payment details upfront ensures
                    a card is on file in case of a late cancellation.
                  </p>
                  <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground text-center">
                    Payment card collection would integrate with Stripe or similar provider.
                  </div>
                </div>
              )}
              {createStep === 3 && (
                <div className="flex flex-col gap-4 py-2">
                  <p className="text-sm text-muted-foreground">
                    You can add guest names and emails now, or leave them blank and share the group booking
                    link later so guests can register themselves.
                  </p>
                  <div className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground text-center">
                    Guest names will be populated via the group booking link after creation.
                  </div>
                </div>
              )}
              <DialogFooter className="flex gap-2">
                {createStep > 1 && (
                  <Button type="button" variant="outline" onClick={() => setCreateStep(s => s - 1)}>Back</Button>
                )}
                {createStep < 3 ? (
                  <>
                    <Button type="button" variant="ghost" onClick={() => setCreateStep(s => s + 1)}>Skip this Step</Button>
                    <Button type="button" onClick={() => setCreateStep(s => s + 1)}>Next</Button>
                  </>
                ) : (
                  <Button type="submit">Create Booking</Button>
                )}
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Waiver bar legend */}
      <div className="flex flex-wrap items-center gap-4 rounded-md border bg-muted/30 px-4 py-2 text-xs">
        <span className="font-medium text-muted-foreground">Waiver Legend:</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />Signed</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-chart-3" />Covered (Minor)</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" />Sent</span>
        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive/40" />Outstanding</span>
      </div>

      <DataTable
        data={filtered as unknown as Record<string, unknown>[]}
        columns={columns as { key: string; label: string; render?: (item: Record<string, unknown>) => React.ReactNode }[]}
        searchField={"contactName" as keyof Record<string, unknown>}
        searchPlaceholder="Search by contact name..."
        onRowClick={(item) => setSelectedBooking(item as unknown as Booking)}
        filters={
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Confirmed">Confirmed</SelectItem>
              <SelectItem value="Pending">Pending</SelectItem>
              <SelectItem value="Cancelled">Cancelled</SelectItem>
              <SelectItem value="Completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      {/* Booking Detail Sheet */}
      <Sheet open={!!selectedBooking} onOpenChange={(open) => { if (!open) { setSelectedBooking(null); setEditingGuestId(null) } }}>
        <SheetContent className="w-[420px] sm:w-[620px] overflow-y-auto">
          {syncedBooking && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  Booking {syncedBooking.id}
                  <StatusBadge status={syncedBooking.status} />
                </SheetTitle>
                <SheetDescription>
                  {syncedBooking.contactName} - {format(parseISO(syncedBooking.date), "MMM d, yyyy")} at {syncedBooking.time}
                </SheetDescription>
              </SheetHeader>

              <Tabs defaultValue="guests" className="mt-6">
                <TabsList className="w-full">
                  <TabsTrigger value="guests" className="flex-1">Guests & Waivers</TabsTrigger>
                  <TabsTrigger value="payment" className="flex-1">Payment</TabsTrigger>
                  <TabsTrigger value="details" className="flex-1">Details</TabsTrigger>
                </TabsList>

                {/* GUESTS TAB */}
                <TabsContent value="guests" className="mt-4 flex flex-col gap-4">
                  <div className="rounded-lg border bg-muted/30 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">Waiver Progress</span>
                      <span className="text-xs text-muted-foreground">
                        {syncedBooking.guests.filter(g => g.waiverStatus === "Signed" || g.waiverStatus === "Covered").length}/{syncedBooking.guests.length} complete
                      </span>
                    </div>
                    <WaiverStatusBar guests={syncedBooking.guests} showLabels />
                    <div className="mt-3 flex gap-2">
                      <Button size="sm" variant="outline" onClick={handleSendAllWaivers}>
                        <Send className="mr-1 h-3 w-3" />Send All Waivers
                      </Button>
                    </div>
                  </div>

                  {/* Group booking link */}
                  <div className="rounded-lg border p-3">
                    <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                      <Link className="h-3.5 w-3.5 text-primary" />Group Booking Link
                    </div>
                    <p className="mb-2 text-xs text-muted-foreground">Share with guests so they can register their info and sign waivers</p>
                    <div className="flex gap-2">
                      <Input readOnly value={getShareLink()} className="h-8 text-xs font-mono bg-muted" onClick={handleCopyLink} />
                      <Button size="sm" variant="outline" className="h-8 shrink-0" onClick={handleCopyLink}>
                        <Copy className="mr-1 h-3 w-3" />Copy
                      </Button>
                    </div>
                  </div>

                  {/* Guest list */}
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Guest List ({syncedBooking.guests.length})</h3>
                    <Button size="sm" variant="outline" className="h-7" onClick={handleAddGuestSlot}>
                      <UserPlus className="mr-1 h-3 w-3" />Add Guest
                    </Button>
                  </div>
                  <div className="flex flex-col gap-2">
                    {syncedBooking.guests.map((g: BookingGuest) => (
                      <div key={g.id} className="rounded-md border p-3">
                        {editingGuestId === g.id ? (
                          <div className="flex flex-col gap-2">
                            <div className="grid grid-cols-2 gap-2">
                              <Input value={editGuestName} onChange={e => setEditGuestName(e.target.value)} placeholder="Name" className="h-8 text-sm" />
                              <Input value={editGuestAge} onChange={e => setEditGuestAge(e.target.value)} type="number" placeholder="Age" className="h-8 text-sm" />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <Input value={editGuestEmail} onChange={e => setEditGuestEmail(e.target.value)} type="email" placeholder="Email" className="h-8 text-sm" />
                              <Input value={editGuestPhone} onChange={e => setEditGuestPhone(e.target.value)} placeholder="Phone" className="h-8 text-sm" />
                            </div>
                            <div className="flex gap-1">
                              <Button size="sm" className="h-7 text-xs" onClick={saveEditGuest}><Check className="mr-1 h-3 w-3" />Save</Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setEditingGuestId(null)}><X className="mr-1 h-3 w-3" />Cancel</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <div className="cursor-pointer" onClick={() => startEditGuest(g)}>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{g.name || <span className="text-muted-foreground italic">Unnamed Guest</span>}</p>
                                {g.isMinor && <Badge variant="outline" className="text-[10px] border-accent text-accent">Minor</Badge>}
                                {g.checkedIn && <Badge className="bg-primary/15 text-primary border-0 text-[10px]">Checked In</Badge>}
                              </div>
                              <div className="mt-0.5 flex items-center gap-3 text-xs text-muted-foreground">
                                {(g.waiverStatus === "Signed" || g.waiverStatus === "Covered") && g.age > 0 && <span>Age: {g.age}</span>}
                                {g.weight && <span>Weight: {g.weight} lbs</span>}
                                {g.email && <span>{g.email}</span>}
                                {g.phone && <span>{g.phone}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <StatusBadge status={g.waiverStatus} />
                              <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => startEditGuest(g)}>
                                <Pencil className="h-3 w-3" />
                              </Button>
                              {(g.waiverStatus === "Outstanding" || g.waiverStatus === "Sent") && (
                                <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => {
                                  if (!g.email) {
                                    toast.error(`No email for ${g.name || "this guest"}. Please add an email first.`)
                                    return
                                  }
                                  dispatch({ type: "UPDATE_GUEST_WAIVER", bookingId: syncedBooking.id, guestId: g.id, status: "Sent" })
                                  toast.info(`Waiver ${g.waiverStatus === "Sent" ? "resent" : "sent"} to ${g.name || "guest"}`)
                                }}>
                                  <Send className="h-3 w-3" />
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                {/* PAYMENT TAB - simplified to Pending/Paid only */}
                <TabsContent value="payment" className="mt-4 flex flex-col gap-4">
                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium">Payment Status</span>
                      <StatusBadge status={syncedBooking.paymentStatus === "Pending" ? "Pending" : "Paid"} />
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      {(["Pending", "Paid"] as const).map((step, i) => {
                        const isPaid = syncedBooking.paymentStatus === "Paid" || syncedBooking.paymentStatus === "Refunded"
                        const isComplete = (isPaid && i <= 1) || (i === 0)
                        const isCurrent = (!isPaid && i === 0) || (isPaid && i === 1)
                        return (
                          <div key={step} className="flex-1 flex flex-col items-center gap-1">
                            <div className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold ${
                              isComplete && !isCurrent ? "bg-primary border-primary text-primary-foreground" :
                              isCurrent ? "border-primary text-primary" :
                              "border-muted text-muted-foreground"
                            }`}>
                              {isComplete && !isCurrent ? <Check className="h-4 w-4" /> : i + 1}
                            </div>
                            <span className={`text-[10px] ${isCurrent ? "font-medium text-primary" : "text-muted-foreground"}`}>{step}</span>
                          </div>
                        )
                      })}
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {syncedBooking.paymentStatus === "Pending" && (
                        <Button size="sm" onClick={() => router.push("/ops/payments")}>
                          <CreditCard className="mr-1 h-3 w-3" />Take Payment
                        </Button>
                      )}
                      {syncedBooking.paymentStatus === "Pending" && (
                        <Button size="sm" variant="outline" onClick={() => router.push("/ops/payments")}>
                          <Pencil className="mr-1 h-3 w-3" />Edit Payment
                        </Button>
                      )}
                      <Button size="sm" variant="outline" onClick={() => toast.info("Invoice sent to " + syncedBooking.contactEmail)}>
                        <Send className="mr-1 h-3 w-3" />Send Invoice
                      </Button>
                      {(syncedBooking.paymentStatus === "Paid") && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => toast.success("Receipt sent to " + syncedBooking.contactEmail)}>
                            <Send className="mr-1 h-3 w-3" />Send Receipt
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => {
                            dispatch({ type: "UPDATE_BOOKING", id: syncedBooking.id, updates: { paymentStatus: "Refunded" as Booking["paymentStatus"] } })
                            toast.success("Refund processed")
                          }}>
                            <RefreshCw className="mr-1 h-3 w-3" />Issue Refund
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="rounded-lg border p-4">
                    <h4 className="mb-3 text-sm font-medium">Price Breakdown</h4>
                    <div className="flex flex-col gap-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Base price ({syncedBooking.partySize} guests)</span>
                        <span className="font-medium">${(syncedBooking.partySize * 65).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax (8.25%)</span>
                        <span className="font-medium">${(syncedBooking.partySize * 65 * 0.0825).toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total</span>
                        <span>${(syncedBooking.partySize * 65 * 1.0825).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* DETAILS TAB */}
                <TabsContent value="details" className="mt-4 flex flex-col gap-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="text-muted-foreground">Contact:</span> <span className="font-medium">{syncedBooking.contactName}</span></div>
                    <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{syncedBooking.contactEmail}</span></div>
                    <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{syncedBooking.contactPhone}</span></div>
                    <div><span className="text-muted-foreground">Party Size:</span> <span className="font-medium">{syncedBooking.partySize}</span></div>
                    <div><span className="text-muted-foreground">Location:</span> <span className="font-medium">{locations.find(l => l.id === syncedBooking.locationId)?.name}</span></div>
                    <div><span className="text-muted-foreground">Created:</span> <span className="font-medium">{format(parseISO(syncedBooking.createdAt), "MMM d, yyyy")}</span></div>
                  </div>
                  {syncedBooking.notes && (
                    <div className="rounded-md border p-3">
                      <p className="text-xs text-muted-foreground">Notes</p>
                      <p className="text-sm">{syncedBooking.notes}</p>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Select
                      value={syncedBooking.status}
                      onValueChange={(v) => {
                        dispatch({ type: "UPDATE_BOOKING", id: syncedBooking.id, updates: { status: v as Booking["status"] } })
                        toast.success(`Status updated to ${v}`)
                      }}
                    >
                      <SelectTrigger className="w-40 h-8"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Confirmed">Confirmed</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
