"use client"

import { useState } from "react"
import { Plus, Upload, Download, RefreshCw, AlertTriangle } from "lucide-react"
import { format, parseISO, differenceInDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { useAppStore } from "@/lib/mock-store"
import { locations } from "@/lib/mock-data"
import type { EquipmentItem, EquipmentCategory } from "@/lib/types"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

const categories: (EquipmentCategory | "All")[] = ["All", "Harnesses", "Trolleys", "Helmets", "Lanyards", "Carabiners", "Brakes", "Tower Components"]

type BulkMode = "status" | "retire" | "add"

export default function EquipmentInventoryPage() {
  const { state, dispatch } = useAppStore()
  const router = useRouter()
  const [categoryTab, setCategoryTab] = useState<string>("All")
  const [createOpen, setCreateOpen] = useState(false)
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkMode, setBulkMode] = useState<BulkMode>("status")
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([])
  const [bulkNewStatus, setBulkNewStatus] = useState<"Active" | "Quarantined" | "Retired">("Retired")

  const today = new Date()
  const filtered = state.equipment
    .filter(e => e.locationId === state.selectedLocationId)
    .filter(e => categoryTab === "All" || e.category === categoryTab)

  // Highlight items nearing retirement
  const nearRetirement = state.equipment.filter(e => {
    if (!e.retireByDate || e.status === "Retired") return false
    return differenceInDays(parseISO(e.retireByDate), today) <= 30
  })

  const columns = [
    { key: "category", label: "Category", render: (e: EquipmentItem) => <span className="text-xs">{e.category}</span> },
    { key: "name", label: "Item", render: (e: EquipmentItem) => <span className="font-medium">{e.name}</span> },
    { key: "serialNumber", label: "Serial", render: (e: EquipmentItem) => <span className="font-mono text-xs">{e.serialNumber}</span> },
    { key: "manufacturer", label: "Mfg" },
    { key: "inServiceDate", label: "In Service", render: (e: EquipmentItem) => format(parseISO(e.inServiceDate), "MMM d, yyyy") },
    { key: "retireByDate", label: "Retire By", render: (e: EquipmentItem) => {
      if (!e.retireByDate) return <span className="text-xs text-muted-foreground">-</span>
      const days = differenceInDays(parseISO(e.retireByDate), today)
      return (
        <div className="flex items-center gap-1">
          <span className={`text-xs ${days <= 30 ? "text-destructive font-medium" : ""}`}>
            {format(parseISO(e.retireByDate), "MMM d, yyyy")}
          </span>
          {days <= 30 && days > 0 && <AlertTriangle className="h-3 w-3 text-destructive" />}
        </div>
      )
    }},
    { key: "status", label: "Status", render: (e: EquipmentItem) => <StatusBadge status={e.status} /> },
    { key: "condition", label: "Condition", render: (e: EquipmentItem) => <StatusBadge status={e.condition} /> },
    { key: "lastInspectionDate", label: "Inspected", render: (e: EquipmentItem) => format(parseISO(e.lastInspectionDate), "MMM d") },
  ]

  function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const quantity = Number(fd.get("quantity") || 1)
    const category = String(fd.get("category") || "Harnesses") as EquipmentCategory
    const baseName = String(fd.get("name") || "New Equipment")
    const serials = String(fd.get("serials") || "").split("\n").filter(Boolean)

    for (let i = 0; i < quantity; i++) {
      const item: EquipmentItem = {
        id: `eq-new-${Date.now()}-${i}`,
        category,
        name: quantity > 1 ? `${baseName} ${i + 1}` : baseName,
        serialNumber: serials[i] || `NEW-${Date.now()}-${i}`,
        manufacturer: String(fd.get("manufacturer") || ""),
        model: String(fd.get("model") || ""),
        locationId: state.selectedLocationId,
        purchaseDate: String(fd.get("purchaseDate") || format(new Date(), "yyyy-MM-dd")),
        inServiceDate: String(fd.get("inServiceDate") || format(new Date(), "yyyy-MM-dd")),
        retireByDate: String(fd.get("retireByDate") || "") || undefined,
        status: "Active",
        condition: "Good",
        lastInspectionDate: format(new Date(), "yyyy-MM-dd"),
        notes: "",
      }
      dispatch({ type: "ADD_EQUIPMENT", item })
    }
    setCreateOpen(false)
    toast.success(`${quantity} equipment item${quantity > 1 ? "s" : ""} added`)
  }

  function handleBulkUpdate() {
    if (bulkMode === "status" || bulkMode === "retire") {
      bulkSelectedIds.forEach(id => {
        dispatch({ type: "UPDATE_EQUIPMENT", id, updates: { status: bulkNewStatus } })
      })
      toast.success(`${bulkSelectedIds.length} items updated to ${bulkNewStatus}`)
    }
    setBulkOpen(false)
    setBulkSelectedIds([])
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Equipment Inventory</h1>
          <p className="text-muted-foreground">Track equipment, serial numbers, and lifecycle</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.info("CSV import would open")}>
            <Upload className="mr-1 h-3 w-3" />Import
          </Button>
          <Button variant="outline" size="sm" onClick={() => toast.info("CSV export would download")}>
            <Download className="mr-1 h-3 w-3" />Export
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setBulkMode("status"); setBulkSelectedIds([]); setBulkOpen(true) }}>
            <RefreshCw className="mr-1 h-3 w-3" />Bulk Update
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />Add Equipment
          </Button>
        </div>
      </div>

      {/* Retirement Alerts */}
      {nearRetirement.length > 0 && (
        <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-3">
          <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">
              {nearRetirement.length} item{nearRetirement.length > 1 ? "s" : ""} approaching mandatory retirement
            </p>
            <p className="text-xs text-muted-foreground">
              {nearRetirement.map(e => e.serialNumber).join(", ")}
            </p>
          </div>
          <Button size="sm" variant="outline" onClick={() => {
            setBulkMode("retire")
            setBulkSelectedIds(nearRetirement.map(e => e.id))
            setBulkNewStatus("Retired")
            setBulkOpen(true)
          }}>
            Mass Retire
          </Button>
        </div>
      )}

      <Tabs value={categoryTab} onValueChange={setCategoryTab}>
        <TabsList className="flex-wrap">
          {categories.map(c => <TabsTrigger key={c} value={c}>{c}</TabsTrigger>)}
        </TabsList>
      </Tabs>

      <DataTable
        data={filtered as unknown as Record<string, unknown>[]}
        columns={columns as { key: string; label: string; render?: (item: Record<string, unknown>) => React.ReactNode }[]}
        searchField={"serialNumber" as keyof Record<string, unknown>}
        searchPlaceholder="Search by serial number..."
        onRowClick={(item) => {
          const eq = item as unknown as EquipmentItem
          router.push(`/admin/equipment-inventory/${eq.id}`)
        }}
      />

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle>Add Equipment</DialogTitle></DialogHeader>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Category</Label>
                <Select name="category" defaultValue="Harnesses">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.filter(c => c !== "All").map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Quantity</Label>
                <Input name="quantity" type="number" min={1} max={50} defaultValue={1} />
              </div>
            </div>
            <div className="flex flex-col gap-2"><Label>Item Name</Label><Input name="name" required placeholder="e.g., Full Body Harness" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label>Manufacturer</Label><Input name="manufacturer" placeholder="e.g., Petzl" /></div>
              <div className="flex flex-col gap-2"><Label>Model</Label><Input name="model" placeholder="e.g., Sequoia SRT" /></div>
            </div>
            <div className="flex flex-col gap-2"><Label>Serial Numbers (one per line)</Label><Textarea name="serials" rows={3} placeholder={"HRN-2026-001\nHRN-2026-002"} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-2"><Label>Purchase Date</Label><Input name="purchaseDate" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} /></div>
              <div className="flex flex-col gap-2"><Label>In-Service Date</Label><Input name="inServiceDate" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} /></div>
              <div className="flex flex-col gap-2"><Label>Retire By</Label><Input name="retireByDate" type="date" /></div>
            </div>
            <DialogFooter><Button type="submit">Add Equipment</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {bulkMode === "retire" ? "Mass Retire Equipment" : bulkMode === "add" ? "Mass Add Equipment" : "Bulk Status Update"}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>New Status</Label>
              <Select value={bulkNewStatus} onValueChange={(v) => setBulkNewStatus(v as typeof bulkNewStatus)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Quarantined">Quarantined</SelectItem>
                  <SelectItem value="Retired">Retired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <Label>Select Equipment ({bulkSelectedIds.length} selected)</Label>
                <div className="flex gap-1">
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setBulkSelectedIds(filtered.map(e => e.id))}>All</Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setBulkSelectedIds([])}>None</Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                {filtered.map(eq => (
                  <label key={eq.id} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-muted/50">
                    <Checkbox
                      checked={bulkSelectedIds.includes(eq.id)}
                      onCheckedChange={(checked) => {
                        setBulkSelectedIds(prev => checked ? [...prev, eq.id] : prev.filter(id => id !== eq.id))
                      }}
                    />
                    <div>
                      <span className="font-mono text-xs">{eq.serialNumber}</span>
                      <p className="text-[10px] text-muted-foreground">{eq.name}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkOpen(false)}>Cancel</Button>
            <Button onClick={handleBulkUpdate} disabled={bulkSelectedIds.length === 0}>
              Update {bulkSelectedIds.length} Items
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
