"use client"

import { useState, useMemo, useCallback } from "react"
import { format, parseISO } from "date-fns"
import {
  Plus, Send, ClipboardList, Trash2, MapPin, Tag, Pencil,
  CheckSquare, Square, MinusSquare, Search, ChevronLeft, ChevronRight,
  Mail, MessageSquare, CalendarClock, Bell,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Switch } from "@/components/ui/switch"
import { StatusBadge } from "@/components/status-badge"
import { useAppStore } from "@/lib/mock-store"
import { locations } from "@/lib/mock-data"
import type { Lead } from "@/lib/types"
import { toast } from "sonner"

const PAGE_SIZE = 10
const statusOrder: Lead["status"][] = ["New", "Contacted", "Qualified", "Won", "Lost"]

export default function LeadsPage() {
  const { state, dispatch } = useAppStore()
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [statusFilter, setStatusFilter] = useState("all")
  const [sourceFilter, setSourceFilter] = useState("all")
  const [noteText, setNoteText] = useState("")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(0)

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkStatusOpen, setBulkStatusOpen] = useState(false)
  const [bulkLocationOpen, setBulkLocationOpen] = useState(false)

  // Dialogs
  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [taskOpen, setTaskOpen] = useState(false)
  const [messageOpen, setMessageOpen] = useState(false)

  // Form states
  const [newLead, setNewLead] = useState({ name: "", email: "", phone: "", source: "Organic", locationId: "loc-1", value: "" })
  const [editForm, setEditForm] = useState({ name: "", email: "", phone: "", source: "", locationId: "", value: "" })
  const [taskForm, setTaskForm] = useState({ type: "Follow-up Call", dueDate: "", reminder: false, reminderDate: "" })
  const [msgForm, setMsgForm] = useState({ via: "email" as "email" | "sms", body: "", scheduleNow: true, scheduleDate: "", scheduleTime: "" })

  const filtered = useMemo(() => {
    return state.leads
      .filter(l => l.locationId === state.selectedLocationId)
      .filter(l => statusFilter === "all" || l.status === statusFilter)
      .filter(l => sourceFilter === "all" || l.source === sourceFilter)
      .filter(l => {
        if (!search) return true
        const q = search.toLowerCase()
        return l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q)
      })
  }, [state.leads, state.selectedLocationId, statusFilter, sourceFilter, search])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const allPageSelected = paged.length > 0 && paged.every(l => selectedIds.has(l.id))
  const somePageSelected = paged.some(l => selectedIds.has(l.id))

  const toggleAll = useCallback(() => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allPageSelected) { paged.forEach(l => next.delete(l.id)) } else { paged.forEach(l => next.add(l.id)) }
      return next
    })
  }, [allPageSelected, paged])

  const toggleOne = useCallback((id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next })
  }, [])

  // Add note with activity log
  const addActivityNote = (leadId: string, text: string) => {
    dispatch({
      type: "ADD_LEAD_NOTE", leadId,
      note: { id: `note-${Date.now()}`, text, createdAt: new Date().toISOString(), author: "Jake Torres" },
    })
  }

  // Edit lead
  const handleOpenEdit = () => {
    if (!selectedLead) return
    setEditForm({
      name: selectedLead.name, email: selectedLead.email, phone: selectedLead.phone,
      source: selectedLead.source, locationId: selectedLead.locationId, value: selectedLead.value?.toString() || "",
    })
    setEditOpen(true)
  }

  const handleSaveEdit = () => {
    if (!selectedLead) return
    const changes: string[] = []
    if (editForm.name !== selectedLead.name) changes.push(`Name: ${selectedLead.name} -> ${editForm.name}`)
    if (editForm.email !== selectedLead.email) changes.push(`Email: ${selectedLead.email} -> ${editForm.email}`)
    if (editForm.phone !== selectedLead.phone) changes.push(`Phone: ${selectedLead.phone} -> ${editForm.phone}`)
    if (editForm.source !== selectedLead.source) changes.push(`Source: ${selectedLead.source} -> ${editForm.source}`)
    if (editForm.locationId !== selectedLead.locationId) {
      const oldLoc = locations.find(l => l.id === selectedLead.locationId)?.name
      const newLoc = locations.find(l => l.id === editForm.locationId)?.name
      changes.push(`Location: ${oldLoc} -> ${newLoc}`)
    }
    if ((editForm.value || "") !== (selectedLead.value?.toString() || "")) changes.push(`Value: $${selectedLead.value || 0} -> $${editForm.value || 0}`)

    // We update via individual dispatches since we don't have a generic UPDATE_LEAD action
    // For now, re-create
    dispatch({ type: "DELETE_LEADS", ids: [selectedLead.id] })
    const updated: Lead = {
      ...selectedLead,
      name: editForm.name, email: editForm.email, phone: editForm.phone,
      source: editForm.source, locationId: editForm.locationId,
      value: editForm.value ? Number(editForm.value) : undefined,
    }
    dispatch({ type: "ADD_LEAD", lead: updated })

    if (changes.length > 0) {
      addActivityNote(updated.id, `Edited lead: ${changes.join("; ")}`)
    }

    setSelectedLead(updated)
    setEditOpen(false)
    toast.success("Lead updated")
  }

  // Create Task
  const handleCreateTask = () => {
    if (!selectedLead) return
    addActivityNote(selectedLead.id, `Task created: ${taskForm.type}, due ${taskForm.dueDate || "no date"}${taskForm.reminder ? `, reminder ${taskForm.reminderDate}` : ""}`)
    toast.success("Task created")
    setTaskOpen(false)
    setTaskForm({ type: "Follow-up Call", dueDate: "", reminder: false, reminderDate: "" })
  }

  // Send Message
  const handleSendMessage = () => {
    if (!selectedLead || !msgForm.body.trim()) { toast.error("Message body is required"); return }
    const method = msgForm.via === "email" ? "Email" : "SMS"
    const timing = msgForm.scheduleNow ? "sent now" : `scheduled for ${msgForm.scheduleDate} ${msgForm.scheduleTime}`
    addActivityNote(selectedLead.id, `${method} ${timing}: "${msgForm.body.substring(0, 80)}${msgForm.body.length > 80 ? "..." : ""}"`)

    // Auto-update status: if current status is before "Contacted", bump to Contacted
    const currentIdx = statusOrder.indexOf(selectedLead.status)
    const contactedIdx = statusOrder.indexOf("Contacted")
    if (currentIdx < contactedIdx) {
      dispatch({ type: "UPDATE_LEAD_STATUS", id: selectedLead.id, status: "Contacted" })
      addActivityNote(selectedLead.id, `Status changed from ${selectedLead.status} to Contacted (auto-updated on message send)`)
      setSelectedLead(prev => prev ? { ...prev, status: "Contacted" } : null)
    }

    toast.success(msgForm.scheduleNow ? "Message sent" : "Message scheduled")
    setMessageOpen(false)
    setMsgForm({ via: "email", body: "", scheduleNow: true, scheduleDate: "", scheduleTime: "" })
  }

  // Bulk actions
  const handleBulkDelete = () => { dispatch({ type: "DELETE_LEADS", ids: Array.from(selectedIds) }); toast.success(`${selectedIds.size} lead(s) deleted`); setSelectedIds(new Set()) }
  const handleBulkStatus = (s: Lead["status"]) => { dispatch({ type: "BULK_UPDATE_LEAD_STATUS", ids: Array.from(selectedIds), status: s }); toast.success(`Updated to ${s}`); setSelectedIds(new Set()); setBulkStatusOpen(false) }
  const handleBulkLocation = (locId: string) => { dispatch({ type: "BULK_UPDATE_LEAD_LOCATION", ids: Array.from(selectedIds), locationId: locId }); toast.success(`Moved`); setSelectedIds(new Set()); setBulkLocationOpen(false) }
  const handleAddLead = () => {
    if (!newLead.name.trim() || !newLead.email.trim()) { toast.error("Name and email are required"); return }
    const lead: Lead = { id: `lead-${Date.now()}`, name: newLead.name.trim(), email: newLead.email.trim(), phone: newLead.phone.trim(), source: newLead.source, status: "New", locationId: newLead.locationId, createdAt: new Date().toISOString(), notes: [], value: newLead.value ? Number(newLead.value) : undefined }
    dispatch({ type: "ADD_LEAD", lead }); toast.success("Lead added"); setNewLead({ name: "", email: "", phone: "", source: "Organic", locationId: "loc-1", value: "" }); setAddOpen(false)
  }

  const handleAddNote = () => {
    if (!noteText.trim() || !selectedLead) return
    addActivityNote(selectedLead.id, noteText.trim())
    setNoteText("")
    toast.success("Note added")
    setSelectedLead(prev => prev ? { ...prev, notes: [...prev.notes, { id: `note-${Date.now()}`, text: noteText.trim(), createdAt: new Date().toISOString(), author: "Jake Torres" }] } : null)
  }

  // Keep selected lead in sync with store
  const storeLead = selectedLead ? state.leads.find(l => l.id === selectedLead.id) : null

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads</h1>
          <p className="text-muted-foreground">Manage and nurture potential customers</p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> Add Lead</Button>
      </div>

      {/* Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-primary/20 bg-primary/5 px-4 py-2.5">
          <span className="text-sm font-medium text-primary">{selectedIds.size} selected</span>
          <div className="h-4 w-px bg-border" />
          <div className="relative">
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setBulkStatusOpen(!bulkStatusOpen)}><Tag className="h-3 w-3" /> Status</Button>
            {bulkStatusOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-36 rounded-md border bg-popover p-1 shadow-md">
                {statusOrder.map(s => (<button key={s} className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent" onClick={() => handleBulkStatus(s)}>{s}</button>))}
              </div>
            )}
          </div>
          <div className="relative">
            <Button size="sm" variant="outline" className="h-7 gap-1 text-xs" onClick={() => setBulkLocationOpen(!bulkLocationOpen)}><MapPin className="h-3 w-3" /> Location</Button>
            {bulkLocationOpen && (
              <div className="absolute left-0 top-full z-50 mt-1 w-44 rounded-md border bg-popover p-1 shadow-md">
                {locations.map(loc => (<button key={loc.id} className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent" onClick={() => handleBulkLocation(loc.id)}>{loc.name}</button>))}
              </div>
            )}
          </div>
          <Button size="sm" variant="destructive" className="h-7 gap-1 text-xs" onClick={handleBulkDelete}><Trash2 className="h-3 w-3" /> Delete</Button>
          <div className="flex-1" />
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedIds(new Set())}>Clear</Button>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search leads..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(0) }} className="w-64 pl-8 h-9" />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0) }}>
          <SelectTrigger className="w-32 h-9"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusOrder.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(0) }}>
          <SelectTrigger className="w-36 h-9"><SelectValue placeholder="Source" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="Google Ads">Google Ads</SelectItem>
            <SelectItem value="Meta Ads">Meta Ads</SelectItem>
            <SelectItem value="Organic">Organic</SelectItem>
            <SelectItem value="Referral">Referral</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10">
                <button onClick={toggleAll} className="flex items-center justify-center text-muted-foreground hover:text-foreground">
                  {allPageSelected ? <CheckSquare className="h-4 w-4" /> : somePageSelected ? <MinusSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                </button>
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Location</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paged.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="h-24 text-center text-muted-foreground">No leads found.</TableCell></TableRow>
            ) : paged.map(lead => (
              <TableRow key={lead.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelectedLead(lead)}>
                <TableCell onClick={(e) => e.stopPropagation()}><Checkbox checked={selectedIds.has(lead.id)} onCheckedChange={() => toggleOne(lead.id)} /></TableCell>
                <TableCell className="font-medium">{lead.name}</TableCell>
                <TableCell className="text-muted-foreground">{lead.email}</TableCell>
                <TableCell>{lead.source}</TableCell>
                <TableCell><StatusBadge status={lead.status} /></TableCell>
                <TableCell>{lead.value ? `$${lead.value.toLocaleString()}` : "-"}</TableCell>
                <TableCell>{format(parseISO(lead.createdAt), "MMM d")}</TableCell>
                <TableCell>{locations.find(loc => loc.id === lead.locationId)?.name || "-"}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{filtered.length} result{filtered.length !== 1 ? "s" : ""}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
            <span className="px-2 text-sm text-muted-foreground">{page + 1} / {totalPages}</span>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      {/* Add Lead Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Lead</DialogTitle><DialogDescription>Enter lead information.</DialogDescription></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5"><Label>Name *</Label><Input placeholder="Full name" value={newLead.name} onChange={e => setNewLead(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="flex flex-col gap-1.5"><Label>Email *</Label><Input type="email" placeholder="email@example.com" value={newLead.email} onChange={e => setNewLead(p => ({ ...p, email: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5"><Label>Phone</Label><Input placeholder="(555) 000-0000" value={newLead.phone} onChange={e => setNewLead(p => ({ ...p, phone: e.target.value }))} /></div>
              <div className="flex flex-col gap-1.5"><Label>Value ($)</Label><Input type="number" placeholder="0" value={newLead.value} onChange={e => setNewLead(p => ({ ...p, value: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5"><Label>Source</Label><Select value={newLead.source} onValueChange={v => setNewLead(p => ({ ...p, source: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Google Ads">Google Ads</SelectItem><SelectItem value="Meta Ads">Meta Ads</SelectItem><SelectItem value="Organic">Organic</SelectItem><SelectItem value="Referral">Referral</SelectItem><SelectItem value="Walk-in">Walk-in</SelectItem><SelectItem value="Phone">Phone</SelectItem></SelectContent></Select></div>
              <div className="flex flex-col gap-1.5"><Label>Location</Label><Select value={newLead.locationId} onValueChange={v => setNewLead(p => ({ ...p, locationId: v }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}</SelectContent></Select></div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setAddOpen(false)}>Cancel</Button><Button onClick={handleAddLead}>Add Lead</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead Detail Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={(open) => { if (!open) setSelectedLead(null) }}>
        <SheetContent className="w-[420px] sm:w-[560px] overflow-y-auto">
          {selectedLead && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  {selectedLead.name}
                  <StatusBadge status={storeLead?.status || selectedLead.status} />
                </SheetTitle>
                <SheetDescription>{selectedLead.email} - {selectedLead.phone}</SheetDescription>
              </SheetHeader>

              <div className="mt-6 flex flex-col gap-6">
                {/* Contact Info */}
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><span className="text-muted-foreground">Source:</span> <span className="font-medium">{selectedLead.source}</span></div>
                  <div><span className="text-muted-foreground">Value:</span> <span className="font-medium">${selectedLead.value?.toLocaleString() || "0"}</span></div>
                  <div><span className="text-muted-foreground">Location:</span> <span className="font-medium">{locations.find(l => l.id === selectedLead.locationId)?.name}</span></div>
                  <div><span className="text-muted-foreground">Created:</span> <span className="font-medium">{format(parseISO(selectedLead.createdAt), "MMM d, yyyy")}</span></div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap gap-2">
                  <Select
                    value={storeLead?.status || selectedLead.status}
                    onValueChange={(v) => {
                      const prev = selectedLead.status
                      dispatch({ type: "UPDATE_LEAD_STATUS", id: selectedLead.id, status: v as Lead["status"] })
                      setSelectedLead({ ...selectedLead, status: v as Lead["status"] })
                      addActivityNote(selectedLead.id, `Status changed from ${prev} to ${v}`)
                      toast.success(`Status updated to ${v}`)
                    }}
                  >
                    <SelectTrigger className="w-36 h-8"><SelectValue /></SelectTrigger>
                    <SelectContent>{statusOrder.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={handleOpenEdit}>
                    <Pencil className="mr-1 h-3 w-3" />Edit Info
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setTaskOpen(true)}>
                    <ClipboardList className="mr-1 h-3 w-3" />Create Task
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setMessageOpen(true)}>
                    <Send className="mr-1 h-3 w-3" />Send Message
                  </Button>
                </div>

                {/* Notes & Activity */}
                <div>
                  <h3 className="mb-3 text-sm font-semibold">Notes & Activity</h3>
                  <div className="flex gap-2">
                    <Textarea placeholder="Add a note..." value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={2} className="flex-1" />
                    <Button size="sm" onClick={handleAddNote} disabled={!noteText.trim()}><Plus className="h-4 w-4" /></Button>
                  </div>
                  <div className="mt-3 flex flex-col gap-2">
                    {[...(storeLead?.notes || selectedLead.notes)].reverse().map(note => (
                      <div key={note.id} className="rounded-md border p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-primary">{note.author}</span>
                          <span className="text-xs text-muted-foreground">{format(parseISO(note.createdAt), "MMM d, h:mm a")}</span>
                        </div>
                        <p className="mt-1 text-sm">{note.text}</p>
                      </div>
                    ))}
                    {(storeLead?.notes || selectedLead.notes).length === 0 && (
                      <p className="py-4 text-center text-sm text-muted-foreground">No notes yet</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Edit Lead Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Lead Information</DialogTitle><DialogDescription>Update contact details and metadata.</DialogDescription></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5"><Label>Name</Label><Input value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} /></div>
              <div className="flex flex-col gap-1.5"><Label>Email</Label><Input type="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5"><Label>Phone</Label><Input value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} /></div>
              <div className="flex flex-col gap-1.5"><Label>Value ($)</Label><Input type="number" value={editForm.value} onChange={e => setEditForm(p => ({ ...p, value: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1.5"><Label>Source</Label>
                <Select value={editForm.source} onValueChange={v => setEditForm(p => ({ ...p, source: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="Google Ads">Google Ads</SelectItem><SelectItem value="Meta Ads">Meta Ads</SelectItem><SelectItem value="Organic">Organic</SelectItem><SelectItem value="Referral">Referral</SelectItem><SelectItem value="Walk-in">Walk-in</SelectItem><SelectItem value="Phone">Phone</SelectItem></SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5"><Label>Location</Label>
                <Select value={editForm.locationId} onValueChange={v => setEditForm(p => ({ ...p, locationId: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{locations.map(loc => <SelectItem key={loc.id} value={loc.id}>{loc.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setEditOpen(false)}>Cancel</Button><Button onClick={handleSaveEdit}>Save Changes</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Dialog */}
      <Dialog open={taskOpen} onOpenChange={setTaskOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Create Task</DialogTitle><DialogDescription>Create a follow-up task for {selectedLead?.name}.</DialogDescription></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Task Type</Label>
              <Select value={taskForm.type} onValueChange={v => setTaskForm(p => ({ ...p, type: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Follow-up Call">Follow-up Call</SelectItem>
                  <SelectItem value="Send Proposal">Send Proposal</SelectItem>
                  <SelectItem value="Schedule Meeting">Schedule Meeting</SelectItem>
                  <SelectItem value="Send Brochure">Send Brochure</SelectItem>
                  <SelectItem value="Custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={taskForm.dueDate} onChange={e => setTaskForm(p => ({ ...p, dueDate: e.target.value }))} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={taskForm.reminder} onCheckedChange={v => setTaskForm(p => ({ ...p, reminder: v }))} id="task-reminder" />
              <Label htmlFor="task-reminder" className="flex items-center gap-1.5"><Bell className="h-3.5 w-3.5" />Set Reminder</Label>
            </div>
            {taskForm.reminder && (
              <div className="flex flex-col gap-1.5">
                <Label>Reminder Date & Time</Label>
                <Input type="datetime-local" value={taskForm.reminderDate} onChange={e => setTaskForm(p => ({ ...p, reminderDate: e.target.value }))} />
              </div>
            )}
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setTaskOpen(false)}>Cancel</Button><Button onClick={handleCreateTask}><ClipboardList className="mr-1.5 h-4 w-4" />Create Task</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Send Message Dialog */}
      <Dialog open={messageOpen} onOpenChange={setMessageOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Send Message</DialogTitle><DialogDescription>Send a message to {selectedLead?.name}.</DialogDescription></DialogHeader>
          <div className="flex flex-col gap-4 py-2">
            <div className="flex flex-col gap-1.5">
              <Label>Send Via</Label>
              <div className="flex gap-2">
                <Button variant={msgForm.via === "email" ? "default" : "outline"} size="sm" onClick={() => setMsgForm(p => ({ ...p, via: "email" }))}>
                  <Mail className="mr-1.5 h-3.5 w-3.5" />Email
                </Button>
                <Button variant={msgForm.via === "sms" ? "default" : "outline"} size="sm" onClick={() => setMsgForm(p => ({ ...p, via: "sms" }))}>
                  <MessageSquare className="mr-1.5 h-3.5 w-3.5" />SMS
                </Button>
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Message</Label>
              <Textarea placeholder={`Write your ${msgForm.via === "email" ? "email" : "text message"}...`} value={msgForm.body} onChange={e => setMsgForm(p => ({ ...p, body: e.target.value }))} rows={4} />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={!msgForm.scheduleNow} onCheckedChange={v => setMsgForm(p => ({ ...p, scheduleNow: !v }))} id="msg-schedule" />
              <Label htmlFor="msg-schedule" className="flex items-center gap-1.5"><CalendarClock className="h-3.5 w-3.5" />Schedule for later</Label>
            </div>
            {!msgForm.scheduleNow && (
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5"><Label>Date</Label><Input type="date" value={msgForm.scheduleDate} onChange={e => setMsgForm(p => ({ ...p, scheduleDate: e.target.value }))} /></div>
                <div className="flex flex-col gap-1.5"><Label>Time</Label><Input type="time" value={msgForm.scheduleTime} onChange={e => setMsgForm(p => ({ ...p, scheduleTime: e.target.value }))} /></div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageOpen(false)}>Cancel</Button>
            <Button onClick={handleSendMessage}><Send className="mr-1.5 h-4 w-4" />{msgForm.scheduleNow ? "Send Now" : "Schedule"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
