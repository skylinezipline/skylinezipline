"use client"

import { useState, useMemo, type Dispatch } from "react"
import { format, parseISO } from "date-fns"
import { Upload, CheckCircle2, Plus, ShieldCheck, ArrowUpDown, PackagePlus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DataTable } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { useAppStore } from "@/lib/mock-store"
import { staff } from "@/lib/mock-data"
import type { MaintenanceTask } from "@/lib/types"
import { toast } from "sonner"
import Link from "next/link"

const statusTabs = ["All", "Open", "In Progress", "Waiting Parts", "Completed", "Verified"]

type SortField = "title" | "priority" | "createdAt" | "completedAt" | "assignedToId"
const sortOptions: { value: SortField; label: string }[] = [
  { value: "createdAt", label: "Date Created" },
  { value: "priority", label: "Priority" },
  { value: "title", label: "Name" },
  { value: "completedAt", label: "Date Completed" },
  { value: "assignedToId", label: "Assigned To" },
]

const priorityOrder: Record<string, number> = { Critical: 0, High: 1, Medium: 2, Low: 3 }

export default function MaintenancePage() {
  const { state, dispatch } = useAppStore()
  const [statusTab, setStatusTab] = useState("All")
  const [sectionTab, setSectionTab] = useState<"equipment" | "system">("equipment")
  const [selectedTask, setSelectedTask] = useState<MaintenanceTask | null>(null)
  const [searchBy, setSearchBy] = useState<"all" | "unit" | "date" | "person">("all")
  const [search, setSearch] = useState("")
  const [sortField, setSortField] = useState<SortField>("createdAt")
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [verifyCode, setVerifyCode] = useState("")
  const [verifyTaskId, setVerifyTaskId] = useState("")
  const [addOpen, setAddOpen] = useState(false)

  // Classify: "system" tasks are ones linked to Tower Components or no equipment
  const systemEquipIds = state.equipment.filter(e => e.category === "Tower Components").map(e => e.id)

  const filtered = useMemo(() => {
    let items = state.maintenance
      .filter(m => statusTab === "All" || m.status === statusTab)
      .filter(m => {
        if (sectionTab === "system") return systemEquipIds.includes(m.equipmentId) || !state.equipment.find(e => e.id === m.equipmentId)
        return !systemEquipIds.includes(m.equipmentId) && state.equipment.find(e => e.id === m.equipmentId)
      })

    if (search) {
      const q = search.toLowerCase()
      items = items.filter(m => {
        if (searchBy === "unit") {
          const eq = state.equipment.find(e => e.id === m.equipmentId)
          return eq?.serialNumber.toLowerCase().includes(q) || eq?.name.toLowerCase().includes(q)
        }
        if (searchBy === "date") return m.createdAt.includes(q) || (m.completedAt || "").includes(q)
        if (searchBy === "person") {
          const s = staff.find(st => st.id === m.assignedToId)
          return s?.name.toLowerCase().includes(q)
        }
        // "all"
        const eq = state.equipment.find(e => e.id === m.equipmentId)
        const s = staff.find(st => st.id === m.assignedToId)
        return (
          m.title.toLowerCase().includes(q) ||
          m.description.toLowerCase().includes(q) ||
          eq?.serialNumber.toLowerCase().includes(q) ||
          s?.name.toLowerCase().includes(q)
        )
      })
    }

    items = [...items].sort((a, b) => {
      if (sortField === "priority") return (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9)
      if (sortField === "title") return a.title.localeCompare(b.title)
      if (sortField === "completedAt") return (b.completedAt || "").localeCompare(a.completedAt || "")
      if (sortField === "assignedToId") return (staff.find(s => s.id === a.assignedToId)?.name || "").localeCompare(staff.find(s => s.id === b.assignedToId)?.name || "")
      return b.createdAt.localeCompare(a.createdAt) // default: newest first
    })

    return items
  }, [state.maintenance, statusTab, sectionTab, search, searchBy, sortField, systemEquipIds, state.equipment])

  const columns = [
    { key: "title", label: "Task", render: (m: MaintenanceTask) => <span className="font-medium text-sm">{m.title}</span> },
    { key: "status", label: "Status", render: (m: MaintenanceTask) => <StatusBadge status={m.status} /> },
    { key: "priority", label: "Priority", render: (m: MaintenanceTask) => <StatusBadge status={m.priority} /> },
    { key: "equipmentId", label: "Unit", render: (m: MaintenanceTask) => {
      const eq = state.equipment.find(e => e.id === m.equipmentId)
      return eq ? <span className="font-mono text-xs">{eq.serialNumber}</span> : <span className="text-xs text-muted-foreground">N/A</span>
    }},
    { key: "assignedToId", label: "Assigned", render: (m: MaintenanceTask) => staff.find(s => s.id === m.assignedToId)?.name || "Unassigned" },
    { key: "createdAt", label: "Created", render: (m: MaintenanceTask) => format(parseISO(m.createdAt), "MMM d") },
    { key: "completedAt", label: "Completed", render: (m: MaintenanceTask) => m.completedAt ? format(parseISO(m.completedAt), "MMM d") : "-" },
  ]

  const updateStatus = (id: string, status: MaintenanceTask["status"]) => {
    const updates: Partial<MaintenanceTask> = { status }
    if (status === "Completed") updates.completedAt = format(new Date(), "yyyy-MM-dd")
    dispatch({ type: "UPDATE_MAINTENANCE", id, updates })
    if (selectedTask?.id === id) setSelectedTask({ ...selectedTask, ...updates } as MaintenanceTask)
    toast.success(`Task updated to ${status}`)
  }

  function handleVerify() {
    if (verifyCode === "1234" || verifyCode.toLowerCase() === "manager") {
      updateStatus(verifyTaskId, "Verified")
      setVerifyOpen(false)
      setVerifyCode("")
      toast.success("Task verified by manager - equipment returned to service")
    } else {
      toast.error("Invalid manager code. Use '1234' for demo.")
    }
  }

  function handleAddTask(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const task: MaintenanceTask = {
      id: `maint-manual-${Date.now()}`,
      equipmentId: String(fd.get("equipmentId") || ""),
      inspectionId: undefined,
      title: String(fd.get("title") || "Untitled Task"),
      description: String(fd.get("description") || ""),
      priority: String(fd.get("priority") || "Medium") as MaintenanceTask["priority"],
      status: "Open",
      assignedToId: String(fd.get("assignedTo") || ""),
      createdAt: format(new Date(), "yyyy-MM-dd"),
      completedAt: null,
      partsUsed: [],
      laborNotes: "",
    }
    dispatch({ type: "ADD_MAINTENANCE", task })
    setAddOpen(false)
    toast.success("Maintenance task created")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Maintenance</h1>
          <p className="text-muted-foreground">Track and manage equipment maintenance tasks</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />Add Task
        </Button>
      </div>

      {/* Equipment vs System toggle */}
      <Tabs value={sectionTab} onValueChange={(v) => setSectionTab(v as "equipment" | "system")}>
        <TabsList>
          <TabsTrigger value="equipment">Equipment Maintenance</TabsTrigger>
          <TabsTrigger value="system">System / Infrastructure</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Status filter tabs */}
      <Tabs value={statusTab} onValueChange={setStatusTab}>
        <TabsList className="flex-wrap">
          {statusTabs.map(s => (
            <TabsTrigger key={s} value={s}>
              {s}
              {s !== "All" && (
                <span className="ml-1 text-xs text-muted-foreground">
                  ({state.maintenance.filter(m => m.status === s).length})
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {/* Search + Sort controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={searchBy} onValueChange={(v) => setSearchBy(v as typeof searchBy)}>
          <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Search All</SelectItem>
            <SelectItem value="unit">By Unit ID</SelectItem>
            <SelectItem value="date">By Date</SelectItem>
            <SelectItem value="person">By Person</SelectItem>
          </SelectContent>
        </Select>
        <Input
          placeholder={searchBy === "unit" ? "Enter serial number..." : searchBy === "date" ? "Enter date (YYYY-MM-DD)..." : searchBy === "person" ? "Enter name..." : "Search tasks..."}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 h-9"
        />
        <div className="ml-auto flex items-center gap-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
            <SelectTrigger className="w-40 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              {sortOptions.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DataTable
        data={filtered as unknown as Record<string, unknown>[]}
        columns={columns as { key: string; label: string; render?: (item: Record<string, unknown>) => React.ReactNode }[]}
        emptyMessage="No maintenance tasks match your filters"
        onRowClick={(item) => setSelectedTask(item as unknown as MaintenanceTask)}
      />

      {/* Task Detail Sheet */}
      <Sheet open={!!selectedTask} onOpenChange={(open) => { if (!open) setSelectedTask(null) }}>
        <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
          {selectedTask && (
            <>
              <SheetHeader>
                <SheetTitle>{selectedTask.title}</SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  <StatusBadge status={selectedTask.status} />
                  <StatusBadge status={selectedTask.priority} />
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-6">
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Linked Equipment</h3>
                  <Link href={`/admin/equipment-inventory/${selectedTask.equipmentId}`} className="text-sm text-primary hover:underline">
                    {state.equipment.find(e => e.id === selectedTask.equipmentId)?.serialNumber || selectedTask.equipmentId}
                  </Link>
                  {selectedTask.inspectionId && (
                    <p className="mt-1 text-xs text-muted-foreground">From inspection: {selectedTask.inspectionId}</p>
                  )}
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Description</h3>
                  <p className="text-sm text-muted-foreground">{selectedTask.description}</p>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Parts Used</h3>
                  {selectedTask.partsUsed.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No parts logged</p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {selectedTask.partsUsed.map((part, i) => (
                        <li key={i} className="text-sm">- {part}</li>
                      ))}
                    </ul>
                  )}
                  {(selectedTask.status === "In Progress" || selectedTask.status === "Waiting Parts") && (
                    <LogPartsButton taskId={selectedTask.id} dispatch={dispatch} currentParts={selectedTask.partsUsed} onUpdate={(parts) => {
                      setSelectedTask(prev => prev ? { ...prev, partsUsed: parts } : null)
                    }} />
                  )}
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Labor Notes</h3>
                  {selectedTask.laborNotes ? (
                    <p className="text-sm">{selectedTask.laborNotes}</p>
                  ) : (
                    <Textarea placeholder="Add labor notes..." rows={3} />
                  )}
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-semibold">Photos</h3>
                  <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Upload className="h-4 w-4" />Upload photos
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">Update Status</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedTask.status === "Open" && (
                      <Button size="sm" onClick={() => updateStatus(selectedTask.id, "In Progress")}>Start Work</Button>
                    )}
                    {selectedTask.status === "In Progress" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => updateStatus(selectedTask.id, "Waiting Parts")}>Waiting Parts</Button>
                        <Button size="sm" onClick={() => updateStatus(selectedTask.id, "Completed")}>
                          <CheckCircle2 className="mr-1 h-3 w-3" />Mark Completed
                        </Button>
                      </>
                    )}
                    {selectedTask.status === "Waiting Parts" && (
                      <Button size="sm" onClick={() => updateStatus(selectedTask.id, "In Progress")}>Parts Received - Resume</Button>
                    )}
                    {selectedTask.status === "Completed" && (
                      <Button size="sm" onClick={() => { setVerifyTaskId(selectedTask.id); setVerifyCode(""); setVerifyOpen(true) }}>
                        <ShieldCheck className="mr-1 h-3 w-3" />Verify (Manager Code)
                      </Button>
                    )}
                    {selectedTask.status === "Verified" && (
                      <p className="text-sm text-primary font-medium">Task verified and closed</p>
                    )}
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Assigned to: {staff.find(s => s.id === selectedTask.assignedToId)?.name || "Unassigned"}
                  {selectedTask.completedAt && <> | Completed: {format(parseISO(selectedTask.completedAt), "MMM d, yyyy")}</>}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Manager Verification Dialog */}
      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogContent className="sm:max-w-[380px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />Manager Verification
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Enter your manager code to verify this maintenance task and return the equipment to service.
            </p>
            <div className="flex flex-col gap-2">
              <Label>Manager Code</Label>
              <Input type="password" value={verifyCode} onChange={(e) => setVerifyCode(e.target.value)} placeholder="Enter code..." onKeyDown={(e) => { if (e.key === "Enter") handleVerify() }} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVerifyOpen(false)}>Cancel</Button>
            <Button onClick={handleVerify}>Verify & Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Task Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Maintenance Task</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddTask} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Title</Label>
              <Input name="title" required placeholder="e.g., Replace brake cable" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Description</Label>
              <Textarea name="description" rows={3} placeholder="Describe the issue..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Equipment</Label>
                <Select name="equipmentId">
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {state.equipment.filter(e => e.locationId === state.selectedLocationId).map(eq => (
                      <SelectItem key={eq.id} value={eq.id}>{eq.serialNumber}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Priority</Label>
                <Select name="priority" defaultValue="Medium">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Critical">Critical</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Assign To</Label>
              <Select name="assignedTo">
                <SelectTrigger><SelectValue placeholder="Select staff..." /></SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">Create Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function LogPartsButton({ taskId, dispatch, currentParts, onUpdate }: { taskId: string; dispatch: Dispatch<any>; currentParts: string[]; onUpdate: (parts: string[]) => void }) {
  const [open, setOpen] = useState(false)
  const [partName, setPartName] = useState("")
  const [partQty, setPartQty] = useState("1")

  function addPart() {
    if (!partName.trim()) return
    const entry = `${partName.trim()} (x${partQty})`
    const updated = [...currentParts, entry]
    dispatch({ type: "UPDATE_MAINTENANCE", id: taskId, updates: { partsUsed: updated } })
    onUpdate(updated)
    setPartName("")
    setPartQty("1")
    toast.success(`Logged: ${entry}`)
  }

  return (
    <>
      <Button size="sm" variant="outline" className="mt-2" onClick={() => setOpen(true)}>
        <PackagePlus className="mr-1 h-3 w-3" />Log Parts Used
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Log Parts Used</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">Add parts from spare inventory used on this task.</p>
            {currentParts.length > 0 && (
              <div className="rounded-md border p-2">
                <p className="text-xs font-semibold mb-1">Already logged:</p>
                {currentParts.map((p, i) => <p key={i} className="text-xs text-muted-foreground">- {p}</p>)}
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="flex-1 flex flex-col gap-1">
                <Label className="text-xs">Part Name</Label>
                <Input value={partName} onChange={(e) => setPartName(e.target.value)} placeholder="e.g., Brake pad set" onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addPart() }}} />
              </div>
              <div className="w-16 flex flex-col gap-1">
                <Label className="text-xs">Qty</Label>
                <Input type="number" min="1" value={partQty} onChange={(e) => setPartQty(e.target.value)} />
              </div>
              <Button size="sm" onClick={addPart}>Add</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
