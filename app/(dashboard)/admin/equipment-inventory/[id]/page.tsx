"use client"

import { use, useMemo, useState } from "react"
import { format, parseISO } from "date-fns"
import { ArrowLeft, Upload, ClipboardCheck, Pencil, Archive, Plus, Wrench, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { StatusBadge } from "@/components/status-badge"
import { Timeline } from "@/components/timeline"
import { DataTable } from "@/components/data-table"
import { useAppStore } from "@/lib/mock-store"
import { locations, getEquipmentTimeline, staff } from "@/lib/mock-data"
import type { Inspection, MaintenanceTask, EquipmentItem } from "@/lib/types"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const spareParts = [
  { id: "sp-1", name: "Brake Pad Set", category: "Brakes", quantity: 12, minStock: 5 },
  { id: "sp-2", name: "Trolley Wheel Bearings", category: "Trolleys", quantity: 8, minStock: 4 },
  { id: "sp-3", name: "Carabiner Gate Spring", category: "Carabiners", quantity: 20, minStock: 10 },
  { id: "sp-4", name: "Harness Buckle Assembly", category: "Harnesses", quantity: 6, minStock: 3 },
  { id: "sp-5", name: "Helmet Chin Strap", category: "Helmets", quantity: 15, minStock: 5 },
  { id: "sp-6", name: "Lanyard Snap Hook", category: "Lanyards", quantity: 10, minStock: 5 },
  { id: "sp-7", name: "Cable Clamp Set", category: "Tower Components", quantity: 4, minStock: 2 },
  { id: "sp-8", name: "Trolley Axle Pin", category: "Trolleys", quantity: 6, minStock: 3 },
]

export default function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { state, dispatch } = useAppStore()
  const router = useRouter()
  const [editOpen, setEditOpen] = useState(false)
  const [addTaskOpen, setAddTaskOpen] = useState(false)
  const [inspectOpen, setInspectOpen] = useState(false)

  const equipment = state.equipment.find(e => e.id === id)
  const timeline = useMemo(() => (equipment ? getEquipmentTimeline(equipment.id) : []), [equipment])
  const equipInspections = state.inspections.filter(i => i.equipmentId === id)
  const equipMaintenance = state.maintenance.filter(m => m.equipmentId === id)

  if (!equipment) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-muted-foreground">Equipment not found</p>
        <Link href="/admin/equipment-inventory">
          <Button variant="outline" className="mt-4">Back to Inventory</Button>
        </Link>
      </div>
    )
  }

  const location = locations.find(l => l.id === equipment.locationId)

  const inspColumns = [
    { key: "date", label: "Date", render: (i: Inspection) => format(parseISO(i.date), "MMM d, yyyy") },
    { key: "type", label: "Type" },
    { key: "overallResult", label: "Result", render: (i: Inspection) => <StatusBadge status={i.overallResult} /> },
    { key: "inspectorId", label: "Inspector", render: (i: Inspection) => staff.find(s => s.id === i.inspectorId)?.name || i.inspectorId },
    { key: "notes", label: "Notes", render: (i: Inspection) => <span className="text-xs text-muted-foreground line-clamp-1">{i.notes || "-"}</span> },
  ]

  const maintColumns = [
    { key: "title", label: "Task", render: (m: MaintenanceTask) => <span className="font-medium">{m.title}</span> },
    { key: "status", label: "Status", render: (m: MaintenanceTask) => <StatusBadge status={m.status} /> },
    { key: "priority", label: "Priority", render: (m: MaintenanceTask) => <StatusBadge status={m.priority} /> },
    { key: "createdAt", label: "Created", render: (m: MaintenanceTask) => format(parseISO(m.createdAt), "MMM d, yyyy") },
    { key: "completedAt", label: "Completed", render: (m: MaintenanceTask) => m.completedAt ? format(parseISO(m.completedAt), "MMM d, yyyy") : "-" },
  ]

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/equipment-inventory">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight font-mono">{equipment.serialNumber}</h1>
            <StatusBadge status={equipment.status} />
            <StatusBadge status={equipment.condition} />
          </div>
          <p className="text-muted-foreground">{equipment.name} - {equipment.category}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-1 h-3 w-3" />Edit
          </Button>
          <Button variant="outline" size="sm" onClick={() => setAddTaskOpen(true)}>
            <Wrench className="mr-1 h-3 w-3" />Add Task
          </Button>
          <Button variant="outline" size="sm" className="text-destructive" onClick={() => {
            if (confirm(`Retire ${equipment.serialNumber}? This will mark it as retired.`)) {
              dispatch({ type: "UPDATE_EQUIPMENT", id: equipment.id, updates: { status: "Retired" } })
              toast.success(`${equipment.serialNumber} has been retired`)
            }
          }}>
            <Archive className="mr-1 h-3 w-3" />Retire
          </Button>
          <Button onClick={() => setInspectOpen(true)}>
            <ClipboardCheck className="mr-2 h-4 w-4" />Run Inspection
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Lifespan Timeline</TabsTrigger>
          <TabsTrigger value="inspections">Inspections ({equipInspections.length})</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance ({equipMaintenance.length})</TabsTrigger>
          <TabsTrigger value="files">Files</TabsTrigger>
          <TabsTrigger value="spares">Spare Parts</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Equipment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div><span className="text-muted-foreground">Category:</span></div>
                  <div className="font-medium">{equipment.category}</div>
                  <div><span className="text-muted-foreground">Manufacturer:</span></div>
                  <div className="font-medium">{equipment.manufacturer}</div>
                  <div><span className="text-muted-foreground">Model:</span></div>
                  <div className="font-medium">{equipment.model}</div>
                  <div><span className="text-muted-foreground">Location:</span></div>
                  <div className="font-medium">{location?.name}</div>
                  <div><span className="text-muted-foreground">Purchase Date:</span></div>
                  <div className="font-medium">{format(parseISO(equipment.purchaseDate), "MMM d, yyyy")}</div>
                  <div><span className="text-muted-foreground">In Service Date:</span></div>
                  <div className="font-medium">{format(parseISO(equipment.inServiceDate), "MMM d, yyyy")}</div>
                  <div><span className="text-muted-foreground">Last Inspection:</span></div>
                  <div className="font-medium">{format(parseISO(equipment.lastInspectionDate), "MMM d, yyyy")}</div>
                  <div><span className="text-muted-foreground">Retire By:</span></div>
                  <div className="font-medium text-destructive">
                    {equipment.retireByDate ? format(parseISO(equipment.retireByDate), "MMM d, yyyy") : "Not set"}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Notes & Photos</CardTitle>
              </CardHeader>
              <CardContent>
                {equipment.notes ? (
                  <p className="text-sm">{equipment.notes}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">No notes</p>
                )}
                <div className="mt-4 flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20">
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-6 w-6" />
                    <span className="text-xs">Drop photos here or click to upload</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="timeline" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Lifespan Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timeline.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">No events recorded</p>
              ) : (
                <Timeline events={timeline} />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inspections" className="mt-4">
          <DataTable
            data={equipInspections as unknown as Record<string, unknown>[]}
            columns={inspColumns as { key: string; label: string; render?: (item: Record<string, unknown>) => React.ReactNode }[]}
            emptyMessage="No inspections recorded"
            actions={
              <Button size="sm" onClick={() => toast.info("Run Inspection flow would open")}>
                <ClipboardCheck className="mr-1 h-3 w-3" />Run Inspection
              </Button>
            }
          />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <DataTable
            data={equipMaintenance as unknown as Record<string, unknown>[]}
            columns={maintColumns as { key: string; label: string; render?: (item: Record<string, unknown>) => React.ReactNode }[]}
            emptyMessage="No maintenance tasks"
          />
        </TabsContent>

        <TabsContent value="files" className="mt-4">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <div className="flex h-32 w-full max-w-md items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20">
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <Upload className="h-8 w-8" />
                  <span className="text-sm">Upload manuals, photos, or documents</span>
                  <Button size="sm" variant="outline" onClick={() => toast.info("File upload would open")}>
                    Browse Files
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="spares" className="mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" />Spare Parts Inventory</CardTitle>
                <Button size="sm" variant="outline" onClick={() => toast.info("Add spare part form would open")}>
                  <Plus className="mr-1 h-3 w-3" />Add Part
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <p className="text-xs text-muted-foreground mb-2">
                  Parts relevant to: <span className="font-medium">{equipment.category}</span>
                </p>
                {spareParts
                  .filter(p => p.category === equipment.category || p.category === "Tower Components")
                  .map(part => (
                    <div key={part.id} className="flex items-center justify-between rounded-md border p-3">
                      <div>
                        <p className="text-sm font-medium">{part.name}</p>
                        <p className="text-xs text-muted-foreground">{part.category}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-semibold ${part.quantity <= part.minStock ? "text-destructive" : "text-primary"}`}>
                          {part.quantity} in stock
                        </p>
                        <p className="text-xs text-muted-foreground">Min: {part.minStock}</p>
                      </div>
                    </div>
                  ))}
                {spareParts.filter(p => p.category === equipment.category || p.category === "Tower Components").length === 0 && (
                  <p className="py-4 text-center text-sm text-muted-foreground">No spare parts logged for this category</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Equipment Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Edit Equipment</DialogTitle></DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            dispatch({ type: "UPDATE_EQUIPMENT", id: equipment.id, updates: {
              name: String(fd.get("name") || equipment.name),
              manufacturer: String(fd.get("manufacturer") || equipment.manufacturer),
              model: String(fd.get("model") || equipment.model),
              notes: String(fd.get("notes") || ""),
              retireByDate: String(fd.get("retireByDate") || "") || undefined,
            }})
            setEditOpen(false)
            toast.success("Equipment updated")
          }} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2"><Label>Name</Label><Input name="name" defaultValue={equipment.name} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label>Manufacturer</Label><Input name="manufacturer" defaultValue={equipment.manufacturer} /></div>
              <div className="flex flex-col gap-2"><Label>Model</Label><Input name="model" defaultValue={equipment.model} /></div>
            </div>
            <div className="flex flex-col gap-2"><Label>Retire By Date</Label><Input name="retireByDate" type="date" defaultValue={equipment.retireByDate || ""} /></div>
            <div className="flex flex-col gap-2"><Label>Notes</Label><Textarea name="notes" rows={3} defaultValue={equipment.notes || ""} /></div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditOpen(false)}>Cancel</Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Maintenance Task Dialog */}
      <Dialog open={addTaskOpen} onOpenChange={setAddTaskOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Add Maintenance Task</DialogTitle></DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const task: MaintenanceTask = {
              id: `maint-equip-${Date.now()}`,
              equipmentId: equipment.id,
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
            setAddTaskOpen(false)
            toast.success("Maintenance task created and saved to Maintenance section")
          }} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2"><Label>Title</Label><Input name="title" required placeholder="e.g., Replace brake cable" /></div>
            <div className="flex flex-col gap-2"><Label>Description</Label><Textarea name="description" rows={3} placeholder="Describe the issue..." /></div>
            <div className="grid grid-cols-2 gap-4">
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
              <div className="flex flex-col gap-2">
                <Label>Assign To</Label>
                <Select name="assignedTo">
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    {staff.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setAddTaskOpen(false)}>Cancel</Button>
              <Button type="submit">Create Task</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Run Inspection Dialog */}
      <Dialog open={inspectOpen} onOpenChange={setInspectOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Run Inspection - {equipment.serialNumber}</DialogTitle></DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            const result = String(fd.get("result") || "Pass") as "Pass" | "Needs Adjustment" | "Fail"
            const inspection: Inspection = {
              id: `insp-equip-${Date.now()}`,
              equipmentId: equipment.id,
              inspectorId: "staff-1",
              date: format(new Date(), "yyyy-MM-dd"),
              type: String(fd.get("type") || "Routine") as Inspection["type"],
              overallResult: result,
              checklist: [
                { id: "c1", label: "Visual Inspection", result },
                { id: "c2", label: "Functional Test", result },
                { id: "c3", label: "Wear Check", result },
              ],
              notes: String(fd.get("notes") || ""),
            }
            dispatch({ type: "ADD_INSPECTION", inspection })
            if (result === "Fail" || result === "Needs Adjustment") {
              const task: MaintenanceTask = {
                id: `maint-auto-${Date.now()}`,
                equipmentId: equipment.id,
                inspectionId: inspection.id,
                title: `${result}: ${equipment.serialNumber}`,
                description: `Auto-created from inspection. ${String(fd.get("notes") || "")}`,
                priority: result === "Fail" ? "Critical" : "Medium",
                status: "Open",
                assignedToId: "",
                createdAt: format(new Date(), "yyyy-MM-dd"),
                completedAt: null,
                partsUsed: [],
                laborNotes: "",
              }
              dispatch({ type: "ADD_MAINTENANCE", task })
              toast.warning(`Maintenance task auto-created for ${result.toLowerCase()} result`)
            }
            setInspectOpen(false)
            toast.success("Inspection recorded and saved to Inspections section")
          }} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Inspection Type</Label>
                <Select name="type" defaultValue="Routine">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Routine">Routine / Daily</SelectItem>
                    <SelectItem value="Periodic">Periodic</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Overall Result</Label>
                <Select name="result" defaultValue="Pass">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pass">Pass</SelectItem>
                    <SelectItem value="Needs Adjustment">Needs Adjustment</SelectItem>
                    <SelectItem value="Fail">Fail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex flex-col gap-2"><Label>Notes</Label><Textarea name="notes" rows={3} placeholder="Observations..." /></div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setInspectOpen(false)}>Cancel</Button>
              <Button type="submit">Submit Inspection</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
