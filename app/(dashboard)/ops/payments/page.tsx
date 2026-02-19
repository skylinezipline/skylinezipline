"use client"

import { useState, useMemo } from "react"
import { Plus, Send, Eye, MoreHorizontal, DollarSign, Clock, AlertTriangle, FileText, CreditCard, Banknote, Printer, RefreshCw, Trash2, Search } from "lucide-react"
import { format, parseISO } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { KPIStatCard } from "@/components/kpi-stat-card"
import { useAppStore } from "@/lib/mock-store"
import type { Invoice, InvoiceLineItem } from "@/lib/types"
import { toast } from "sonner"

export default function PaymentsPage() {
  const { state, dispatch } = useAppStore()
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("dueDate")
  const [searchQuery, setSearchQuery] = useState("")
  const [createOpen, setCreateOpen] = useState(false)
  const [paymentOpen, setPaymentOpen] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<"card" | "cash" | null>(null)

  // Multi-line item state for create invoice
  const [lineItems, setLineItems] = useState<{ desc: string; qty: number; price: number }[]>([
    { desc: "Zipline Tour - Standard", qty: 2, price: 89 },
  ])

  // Edit invoice state
  const [editOpen, setEditOpen] = useState(false)
  const [editLineItems, setEditLineItems] = useState<{ desc: string; qty: number; price: number }[]>([])

  const locationInvoices = state.invoices.filter(inv => inv.locationId === state.selectedLocationId)

  // Search across name, invoice number, dates
  const searchFiltered = locationInvoices.filter(inv => {
    if (!searchQuery) return true
    const q = searchQuery.toLowerCase()
    return (
      inv.contactName.toLowerCase().includes(q) ||
      inv.id.toLowerCase().includes(q) ||
      inv.issuedDate.includes(q) ||
      inv.dueDate.includes(q) ||
      inv.contactEmail.toLowerCase().includes(q)
    )
  })

  const filtered = searchFiltered
    .filter(inv => statusFilter === "all" || inv.status === statusFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case "dueDate": return a.dueDate.localeCompare(b.dueDate)
        case "status": return a.status.localeCompare(b.status)
        case "name": return a.contactName.localeCompare(b.contactName)
        case "amount": return b.total - a.total
        default: return 0
      }
    })

  const stats = useMemo(() => {
    const totalRevenue = locationInvoices.filter(i => i.status === "Paid").reduce((sum, i) => sum + i.total, 0)
    const outstanding = locationInvoices.filter(i => i.status === "Sent" || i.status === "Overdue").reduce((sum, i) => sum + i.total, 0)
    const overdueCount = locationInvoices.filter(i => i.status === "Overdue").length
    const paidCount = locationInvoices.filter(i => i.status === "Paid").length
    const totalCount = locationInvoices.length
    const collectionRate = totalCount > 0 ? Math.round((paidCount / totalCount) * 100) : 0
    return { totalRevenue, outstanding, overdueCount, collectionRate }
  }, [locationInvoices])

  // Synced invoice for detail view
  const syncedInvoice = useMemo(() => {
    if (!selectedInvoice) return null
    return state.invoices.find(i => i.id === selectedInvoice.id) || null
  }, [selectedInvoice, state.invoices])

  const columns = [
    { key: "id", label: "Invoice", render: (inv: Invoice) => <span className="font-mono text-xs">{inv.id.toUpperCase()}</span> },
    { key: "contactName", label: "Customer" },
    { key: "total", label: "Amount", render: (inv: Invoice) => <span className="font-mono font-medium">${inv.total.toLocaleString("en-US", { minimumFractionDigits: 2 })}</span> },
    { key: "issuedDate", label: "Issued", render: (inv: Invoice) => format(parseISO(inv.issuedDate), "MMM d, yyyy") },
    { key: "dueDate", label: "Due", render: (inv: Invoice) => format(parseISO(inv.dueDate), "MMM d, yyyy") },
    { key: "status", label: "Status", render: (inv: Invoice) => <StatusBadge status={inv.status} /> },
    {
      key: "actions", label: "", className: "w-10",
      render: (inv: Invoice) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => e.stopPropagation()}><MoreHorizontal className="h-4 w-4" /><span className="sr-only">Actions</span></Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv) }}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
            {inv.status === "Draft" && (
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation()
                dispatch({ type: "UPDATE_INVOICE", id: inv.id, updates: { status: "Sent" } })
                toast.success(`Invoice ${inv.id.toUpperCase()} sent`)
              }}><Send className="mr-2 h-4 w-4" />Send Invoice</DropdownMenuItem>
            )}
            {(inv.status === "Sent" || inv.status === "Overdue") && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv); setPaymentOpen(true) }}>
                <DollarSign className="mr-2 h-4 w-4" />Take Payment
              </DropdownMenuItem>
            )}
            {(inv.status === "Draft" || inv.status === "Sent") && (
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setSelectedInvoice(inv); openEditInvoice(inv) }}>
                <FileText className="mr-2 h-4 w-4" />Edit Invoice
              </DropdownMenuItem>
            )}
            {inv.status !== "Void" && inv.status !== "Paid" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-destructive" onClick={(e) => {
                  e.stopPropagation()
                  dispatch({ type: "UPDATE_INVOICE", id: inv.id, updates: { status: "Void" } })
                  toast.info(`Invoice voided`)
                }}>Void Invoice</DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ]

  function openEditInvoice(inv: Invoice) {
    setEditLineItems(inv.lineItems.map(li => ({ desc: li.description, qty: li.quantity, price: li.unitPrice })))
    setEditOpen(true)
  }

  function handleSaveEdit() {
    if (!syncedInvoice) return
    const newLineItems: InvoiceLineItem[] = editLineItems.map((li, i) => ({
      id: `li-edit-${i}`,
      description: li.desc,
      quantity: li.qty,
      unitPrice: li.price,
      total: li.qty * li.price,
    }))
    const subtotal = newLineItems.reduce((s, l) => s + l.total, 0)
    const tax = Math.round(subtotal * 0.07 * 100) / 100
    dispatch({
      type: "UPDATE_INVOICE",
      id: syncedInvoice.id,
      updates: { lineItems: newLineItems, amount: subtotal, tax, total: Math.round((subtotal + tax) * 100) / 100 },
    })
    toast.success("Invoice updated")
    setEditOpen(false)
  }

  // Create invoice with multiple line items
  function handleCreateInvoice(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const newLineItemsData: InvoiceLineItem[] = lineItems.map((li, i) => ({
      id: `li-${Date.now()}-${i}`,
      description: li.desc,
      quantity: li.qty,
      unitPrice: li.price,
      total: li.qty * li.price,
    }))
    const subtotal = newLineItemsData.reduce((s, l) => s + l.total, 0)
    const tax = Math.round(subtotal * 0.07 * 100) / 100
    const total = Math.round((subtotal + tax) * 100) / 100

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      bookingId: String(fd.get("bookingId") || ""),
      locationId: state.selectedLocationId,
      contactName: String(fd.get("contactName") || ""),
      contactEmail: String(fd.get("contactEmail") || ""),
      amount: subtotal,
      tax,
      total,
      status: "Draft",
      issuedDate: "2026-02-14",
      dueDate: String(fd.get("dueDate") || ""),
      lineItems: newLineItemsData,
      notes: String(fd.get("notes") || ""),
    }
    dispatch({ type: "ADD_INVOICE", invoice: newInvoice })
    setCreateOpen(false)
    setLineItems([{ desc: "Zipline Tour - Standard", qty: 2, price: 89 }])
    toast.success("Invoice created as draft")
  }

  // Take payment handler
  const handleTakePayment = (method: "card" | "cash") => {
    if (!syncedInvoice) return
    dispatch({ type: "UPDATE_INVOICE", id: syncedInvoice.id, updates: { status: "Paid", paidDate: "2026-02-14" } })
    setPaymentOpen(false)
    setPaymentMethod(null)
    toast.success(`Payment received via ${method}. Invoice marked as Paid.`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
          <p className="text-muted-foreground">Manage invoices and track revenue</p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Create Invoice</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Invoice</DialogTitle>
              <DialogDescription>Add line items for the invoice. Each row is a separate charge.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateInvoice} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contactName">Customer Name</Label>
                  <Input id="contactName" name="contactName" required placeholder="Full name" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="contactEmail">Email</Label>
                  <Input id="contactEmail" name="contactEmail" type="email" required placeholder="email@example.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="bookingId">Booking ID (optional)</Label>
                  <Input id="bookingId" name="bookingId" placeholder="bk-123" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="dueDate">Due Date</Label>
                  <Input id="dueDate" name="dueDate" type="date" required />
                </div>
              </div>
              <Separator />
              {/* Line items table */}
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <Label>Line Items</Label>
                  <Button type="button" variant="outline" size="sm" className="h-7 text-xs" onClick={() => setLineItems(prev => [...prev, { desc: "", qty: 1, price: 0 }])}>
                    <Plus className="mr-1 h-3 w-3" />Add Line
                  </Button>
                </div>
                <div className="rounded-md border">
                  <div className="grid grid-cols-[1fr_80px_100px_40px] gap-2 border-b px-3 py-2 text-xs font-medium text-muted-foreground">
                    <span>Description</span><span>Qty</span><span>Unit Price</span><span></span>
                  </div>
                  {lineItems.map((li, i) => (
                    <div key={i} className="grid grid-cols-[1fr_80px_100px_40px] gap-2 px-3 py-2 items-center">
                      <Input className="h-8 text-sm" value={li.desc} onChange={e => {
                        const updated = [...lineItems]; updated[i] = { ...updated[i], desc: e.target.value }; setLineItems(updated)
                      }} placeholder="Description" />
                      <Input className="h-8 text-sm" type="number" min={1} value={li.qty} onChange={e => {
                        const updated = [...lineItems]; updated[i] = { ...updated[i], qty: parseInt(e.target.value) || 1 }; setLineItems(updated)
                      }} />
                      <Input className="h-8 text-sm" type="number" min={0} step={0.01} value={li.price} onChange={e => {
                        const updated = [...lineItems]; updated[i] = { ...updated[i], price: parseFloat(e.target.value) || 0 }; setLineItems(updated)
                      }} />
                      {lineItems.length > 1 && (
                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={() => setLineItems(prev => prev.filter((_, idx) => idx !== i))}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <div className="border-t px-3 py-2 text-sm font-medium flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-mono">${lineItems.reduce((s, l) => s + l.qty * l.price, 0).toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="Additional notes..." />
              </div>
              <DialogFooter><Button type="submit">Create Draft</Button></DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPIStatCard label="Collected Revenue" value={`$${stats.totalRevenue.toLocaleString()}`} trend="up" trendValue="+12%" icon={<DollarSign className="h-4 w-4" />} />
        <KPIStatCard label="Outstanding" value={`$${stats.outstanding.toLocaleString()}`} trend={stats.outstanding > 0 ? "up" : "flat"} trendValue={stats.outstanding > 0 ? `${locationInvoices.filter(i => i.status === "Sent" || i.status === "Overdue").length} invoices` : "None"} icon={<Clock className="h-4 w-4" />} />
        <KPIStatCard label="Overdue" value={stats.overdueCount} trend={stats.overdueCount > 0 ? "down" : "flat"} trendValue={stats.overdueCount > 0 ? "Needs follow-up" : "All clear"} icon={<AlertTriangle className="h-4 w-4" />} />
        <KPIStatCard label="Collection Rate" value={`${stats.collectionRate}%`} trend="up" trendValue="+3%" icon={<FileText className="h-4 w-4" />} />
      </div>

      {/* Search + Sort + Filter bar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, invoice #, email, or date..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-40 h-9"><SelectValue placeholder="Sort by" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="dueDate">Due Date</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
            <SelectItem value="amount">Amount (High-Low)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Draft">Draft</SelectItem>
            <SelectItem value="Sent">Sent</SelectItem>
            <SelectItem value="Paid">Paid</SelectItem>
            <SelectItem value="Overdue">Overdue</SelectItem>
            <SelectItem value="Void">Void</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* POS info bar */}
      <div className="flex items-center gap-2 rounded-md border border-dashed bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        <Printer className="h-4 w-4" />
        <span>Handheld POS terminal connected for walk-in payments. Use "Take Payment" on any invoice to process.</span>
      </div>

      <DataTable
        data={filtered as unknown as Record<string, unknown>[]}
        columns={columns as { key: string; label: string; render?: (item: Record<string, unknown>) => React.ReactNode; className?: string }[]}
        searchField={"contactName" as keyof Record<string, unknown>}
        searchPlaceholder="Search by customer name..."
        onRowClick={(item) => setSelectedInvoice(item as unknown as Invoice)}
      />

      {/* Take Payment Dialog */}
      <Dialog open={paymentOpen} onOpenChange={(o) => { setPaymentOpen(o); if (!o) setPaymentMethod(null) }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Take Payment</DialogTitle>
            <DialogDescription>
              {syncedInvoice && `${syncedInvoice.id.toUpperCase()} - $${syncedInvoice.total.toFixed(2)} for ${syncedInvoice.contactName}`}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <p className="text-sm text-muted-foreground">Select payment method:</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${paymentMethod === "card" ? "ring-2 ring-primary" : ""}`}
                onClick={() => setPaymentMethod("card")}
              >
                <CreditCard className="h-8 w-8 text-primary" />
                <span className="text-sm font-medium">Card</span>
                <span className="text-[10px] text-muted-foreground">POS terminal or online</span>
              </button>
              <button
                className={`flex flex-col items-center gap-2 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${paymentMethod === "cash" ? "ring-2 ring-primary" : ""}`}
                onClick={() => setPaymentMethod("cash")}
              >
                <Banknote className="h-8 w-8 text-chart-3" />
                <span className="text-sm font-medium">Cash</span>
                <span className="text-[10px] text-muted-foreground">In-person cash payment</span>
              </button>
            </div>
            {paymentMethod === "card" && (
              <div className="rounded-md border bg-muted/30 p-3 text-sm text-center text-muted-foreground">
                Stripe terminal integration would process the card here. For POS walk-ins, use the handheld terminal.
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPaymentOpen(false); setPaymentMethod(null) }}>Cancel</Button>
            <Button disabled={!paymentMethod} onClick={() => paymentMethod && handleTakePayment(paymentMethod)}>
              Confirm Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice {syncedInvoice?.id.toUpperCase()}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <Label>Line Items</Label>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setEditLineItems(prev => [...prev, { desc: "", qty: 1, price: 0 }])}>
                <Plus className="mr-1 h-3 w-3" />Add Line
              </Button>
            </div>
            <div className="rounded-md border">
              <div className="grid grid-cols-[1fr_80px_100px_40px] gap-2 border-b px-3 py-2 text-xs font-medium text-muted-foreground">
                <span>Description</span><span>Qty</span><span>Unit Price</span><span></span>
              </div>
              {editLineItems.map((li, i) => (
                <div key={i} className="grid grid-cols-[1fr_80px_100px_40px] gap-2 px-3 py-2 items-center">
                  <Input className="h-8 text-sm" value={li.desc} onChange={e => {
                    const u = [...editLineItems]; u[i] = { ...u[i], desc: e.target.value }; setEditLineItems(u)
                  }} />
                  <Input className="h-8 text-sm" type="number" min={1} value={li.qty} onChange={e => {
                    const u = [...editLineItems]; u[i] = { ...u[i], qty: parseInt(e.target.value) || 1 }; setEditLineItems(u)
                  }} />
                  <Input className="h-8 text-sm" type="number" min={0} step={0.01} value={li.price} onChange={e => {
                    const u = [...editLineItems]; u[i] = { ...u[i], price: parseFloat(e.target.value) || 0 }; setEditLineItems(u)
                  }} />
                  {editLineItems.length > 1 && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditLineItems(prev => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
              <div className="border-t px-3 py-2 text-sm font-medium flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono">${editLineItems.reduce((s, l) => s + l.qty * l.price, 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice Detail Sheet */}
      <Sheet open={!!selectedInvoice && !paymentOpen && !editOpen} onOpenChange={(open) => { if (!open) setSelectedInvoice(null) }}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          {syncedInvoice && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">{syncedInvoice.id.toUpperCase()}<StatusBadge status={syncedInvoice.status} /></SheetTitle>
                <SheetDescription>Invoice for {syncedInvoice.contactName}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-6">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><span className="text-muted-foreground">Customer</span><p className="font-medium">{syncedInvoice.contactName}</p></div>
                  <div><span className="text-muted-foreground">Email</span><p className="font-medium">{syncedInvoice.contactEmail}</p></div>
                  <div><span className="text-muted-foreground">Issued</span><p className="font-medium">{format(parseISO(syncedInvoice.issuedDate), "MMM d, yyyy")}</p></div>
                  <div><span className="text-muted-foreground">Due</span><p className="font-medium">{format(parseISO(syncedInvoice.dueDate), "MMM d, yyyy")}</p></div>
                  {syncedInvoice.paidDate && <div><span className="text-muted-foreground">Paid</span><p className="font-medium">{format(parseISO(syncedInvoice.paidDate!), "MMM d, yyyy")}</p></div>}
                  {syncedInvoice.bookingId && <div><span className="text-muted-foreground">Booking</span><p className="font-mono text-xs font-medium">{syncedInvoice.bookingId}</p></div>}
                </div>
                <Separator />
                <div>
                  <h4 className="mb-3 text-sm font-semibold">Line Items</h4>
                  <div className="flex flex-col gap-2">
                    {syncedInvoice.lineItems.map((li) => (
                      <div key={li.id} className="flex items-center justify-between rounded-md border p-3">
                        <div><p className="text-sm font-medium">{li.description}</p><p className="text-xs text-muted-foreground">{li.quantity} x ${li.unitPrice.toFixed(2)}</p></div>
                        <span className="font-mono text-sm font-medium">${li.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <Separator />
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span className="font-mono">${syncedInvoice.amount.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Tax (7%)</span><span className="font-mono">${syncedInvoice.tax.toFixed(2)}</span></div>
                  <Separator />
                  <div className="flex justify-between text-base font-bold"><span>Total</span><span className="font-mono">${syncedInvoice.total.toFixed(2)}</span></div>
                </div>
                {syncedInvoice.notes && (
                  <>
                    <Separator />
                    <div><h4 className="mb-1 text-sm font-semibold">Notes</h4><p className="text-sm text-muted-foreground">{syncedInvoice.notes}</p></div>
                  </>
                )}
                <Separator />
                <div className="flex flex-wrap gap-2">
                  {syncedInvoice.status === "Draft" && (
                    <Button size="sm" onClick={() => {
                      dispatch({ type: "UPDATE_INVOICE", id: syncedInvoice.id, updates: { status: "Sent" } })
                      toast.success("Invoice sent - status updated to Sent")
                    }}><Send className="mr-1 h-3 w-3" />Send Invoice</Button>
                  )}
                  {(syncedInvoice.status === "Sent" || syncedInvoice.status === "Overdue") && (
                    <>
                      <Button size="sm" onClick={() => setPaymentOpen(true)}><DollarSign className="mr-1 h-3 w-3" />Take Payment</Button>
                      <Button size="sm" variant="outline" onClick={() => toast.info(`Reminder sent to ${syncedInvoice.contactEmail}`)}><Send className="mr-1 h-3 w-3" />Send Reminder</Button>
                    </>
                  )}
                  {(syncedInvoice.status === "Draft" || syncedInvoice.status === "Sent") && (
                    <Button size="sm" variant="outline" onClick={() => openEditInvoice(syncedInvoice)}>
                      <FileText className="mr-1 h-3 w-3" />Edit
                    </Button>
                  )}
                  {syncedInvoice.status === "Paid" && (
                    <>
                      <Button size="sm" variant="outline" onClick={() => toast.success(`Receipt sent to ${syncedInvoice.contactEmail}`)}>
                        <Send className="mr-1 h-3 w-3" />Send Receipt
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        dispatch({ type: "UPDATE_INVOICE", id: syncedInvoice.id, updates: { status: "Void" } })
                        toast.success("Refund issued")
                      }}>
                        <RefreshCw className="mr-1 h-3 w-3" />Issue Refund
                      </Button>
                    </>
                  )}
                  {syncedInvoice.status !== "Void" && syncedInvoice.status !== "Paid" && (
                    <Button size="sm" variant="outline" className="text-destructive" onClick={() => {
                      dispatch({ type: "UPDATE_INVOICE", id: syncedInvoice.id, updates: { status: "Void" } })
                      toast.info("Invoice voided")
                    }}>Void</Button>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
