"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { ClipboardCheck, Plus, ListChecks, Upload, AlertTriangle, CalendarClock } from "lucide-react"
import { differenceInDays } from "date-fns"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { DataTable } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { useAppStore } from "@/lib/mock-store"
import { staff } from "@/lib/mock-data"
import type { Inspection, InspectionChecklistItem, EquipmentItem } from "@/lib/types"
import { toast } from "sonner"

const checklistTemplates: Record<string, string[]> = {
  Harnesses: ["Webbing condition", "Buckle function", "Stitching integrity", "Label legibility"],
  Trolleys: ["Wheel rotation", "Frame integrity", "Sheave condition", "Safety latch"],
  Helmets: ["Shell condition", "Chin strap", "Headband adjustment"],
  Lanyards: ["Webbing condition", "Connector integrity", "Energy absorber"],
  Carabiners: ["Gate function", "Locking mechanism", "Body integrity"],
  Brakes: ["Braking mechanism", "Cable wear", "Reset function", "Mounting hardware"],
  "Tower Components": ["Structural integrity", "Bolt torque", "Rust/corrosion", "Guardrails"],
}

type ResultVal = "Pass" | "Needs Adjustment" | "Fail"

// Bulk inspection steps
type BulkStep = "select-category" | "select-units" | "mark-failures" | "detail-failures" | "done"

export default function InspectionsPage() {
  const { state, dispatch } = useAppStore()

  // Single inspection
  const [inspectOpen, setInspectOpen] = useState(false)
  const [selectedEquipId, setSelectedEquipId] = useState("")
  const [checklistState, setChecklistState] = useState<{ label: string; result: ResultVal | null; notes: string }[]>([])
  const [inspNotes, setInspNotes] = useState("")

  // Add manual inspection
  const [addOpen, setAddOpen] = useState(false)

  // Bulk inspection
  const [bulkOpen, setBulkOpen] = useState(false)
  const [bulkStep, setBulkStep] = useState<BulkStep>("select-category")
  const [bulkCategory, setBulkCategory] = useState("")
  const [bulkSelectedIds, setBulkSelectedIds] = useState<string[]>([])
  const [bulkFailedIds, setBulkFailedIds] = useState<string[]>([])
  const [bulkCurrentFailIdx, setBulkCurrentFailIdx] = useState(0)
  const [bulkFailNotes, setBulkFailNotes] = useState<Record<string, { result: ResultVal; notes: string }>>({})

  const locationEquipment = state.equipment.filter(e => e.locationId === state.selectedLocationId && e.status === "Active")
  const locationInspections = state.inspections.filter(i =>
    state.equipment.some(e => e.id === i.equipmentId && e.locationId === state.selectedLocationId)
  )

  const columns = [
    { key: "date", label: "Date", render: (i: Inspection) => format(parseISO(i.date), "MMM d, yyyy") },
    { key: "equipmentId", label: "Equipment", render: (i: Inspection) => {
      const eq = state.equipment.find(e => e.id === i.equipmentId)
      return eq ? <span className="font-mono text-xs">{eq.serialNumber}</span> : i.equipmentId
    }},
    { key: "type", label: "Type" },
    { key: "overallResult", label: "Result", render: (i: Inspection) => <StatusBadge status={i.overallResult} /> },
    { key: "inspectorId", label: "Inspector", render: (i: Inspection) => staff.find(s => s.id === i.inspectorId)?.name || i.inspectorId },
    { key: "notes", label: "Notes", render: (i: Inspection) => <span className="text-xs text-muted-foreground line-clamp-1">{i.notes || "-"}</span> },
  ]

  // ---- Single Inspection ----
  function startInspection(equipId: string) {
    const eq = state.equipment.find(e => e.id === equipId)
    if (!eq) return
    const template = checklistTemplates[eq.category] || ["General check"]
    setChecklistState(template.map(label => ({ label, result: null, notes: "" })))
    setSelectedEquipId(equipId)
    setInspNotes("")
    setInspectOpen(true)
  }

  function submitInspection() {
    const eq = state.equipment.find(e => e.id === selectedEquipId)
    if (!eq) return
    if (checklistState.some(c => c.result === null)) {
      toast.error("Please complete all checklist items")
      return
    }
    const results = checklistState.map(c => c.result!)
    let overallResult: Inspection["overallResult"] = "Pass"
    if (results.includes("Fail")) overallResult = "Fail"
    else if (results.includes("Needs Adjustment")) overallResult = "Needs Adjustment"

    const checklist: InspectionChecklistItem[] = checklistState.map((c, i) => ({
      id: `cl-new-${Date.now()}-${i}`, label: c.label, result: c.result!, notes: c.notes,
    }))
    const inspection: Inspection = {
      id: `insp-${Date.now()}`, equipmentId: selectedEquipId, inspectorId: "staff-1",
      date: format(new Date(), "yyyy-MM-dd"), type: "Routine", overallResult, checklist,
      notes: inspNotes, photos: [],
    }
    dispatch({ type: "ADD_INSPECTION", inspection })
    setInspectOpen(false)
    if (overallResult === "Fail" || overallResult === "Needs Adjustment") {
      toast.warning(`Inspection ${overallResult} - maintenance task auto-created`, { duration: 5000 })
    } else {
      toast.success("Inspection submitted successfully")
    }
  }

  // ---- Bulk Inspection ----
  const bulkCategoryEquipment = locationEquipment.filter(e => e.category === bulkCategory)

  function startBulk() {
    setBulkCategory("")
    setBulkSelectedIds([])
    setBulkFailedIds([])
    setBulkCurrentFailIdx(0)
    setBulkFailNotes({})
    setBulkStep("select-category")
    setBulkOpen(true)
  }

  function bulkSubmitPassed() {
    // Ask which ones failed
    setBulkStep("mark-failures")
  }

  function bulkConfirmFailures() {
    if (bulkFailedIds.length === 0) {
      // All passed
      finishBulk()
    } else {
      setBulkCurrentFailIdx(0)
      setBulkStep("detail-failures")
    }
  }

  function bulkNextFail() {
    if (bulkCurrentFailIdx < bulkFailedIds.length - 1) {
      setBulkCurrentFailIdx(prev => prev + 1)
    } else {
      finishBulk()
    }
  }

  function finishBulk() {
    const todayStr = format(new Date(), "yyyy-MM-dd")
    bulkSelectedIds.forEach(eqId => {
      const isFailed = bulkFailedIds.includes(eqId)
      const failInfo = bulkFailNotes[eqId]
      const overallResult: Inspection["overallResult"] = isFailed
        ? (failInfo?.result || "Fail")
        : "Pass"
      const inspection: Inspection = {
        id: `insp-bulk-${Date.now()}-${eqId}`,
        equipmentId: eqId,
        inspectorId: "staff-1",
        date: todayStr,
        type: "Routine",
        overallResult,
        checklist: [{ id: `cl-bulk-${eqId}`, label: "Bulk inspection", result: overallResult, notes: failInfo?.notes || "" }],
        notes: isFailed ? failInfo?.notes || "Issue found during bulk inspection" : "Passed bulk inspection",
        photos: [],
      }
      dispatch({ type: "ADD_INSPECTION", inspection })
    })
    setBulkStep("done")
    toast.success(`${bulkSelectedIds.length} items inspected (${bulkFailedIds.length} issues found)`)
  }

  // ---- Manual Add ----
  function handleManualAdd(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const inspType = String(fd.get("inspType") || "Routine")
    const result = String(fd.get("result") || "Pass") as Inspection["overallResult"]
    const equipId = String(fd.get("equipmentId") || "")
    const inspectorName = String(fd.get("inspectorName") || "")
    const notes = String(fd.get("notes") || "")
    const companyName = String(fd.get("companyName") || "")
    const regulatory = String(fd.get("regulatory") || "")

    const fullNotes = [notes, companyName && `Company: ${companyName}`, regulatory && `Standards: ${regulatory}`].filter(Boolean).join(" | ")

    const inspection: Inspection = {
      id: `insp-manual-${Date.now()}`,
      equipmentId: equipId || "general",
      inspectorId: inspectorName || "external",
      date: String(fd.get("date") || format(new Date(), "yyyy-MM-dd")),
      type: inspType as Inspection["type"],
      overallResult: result,
      checklist: [{ id: `cl-manual-${Date.now()}`, label: "Manual entry", result, notes: fullNotes }],
      notes: fullNotes,
      photos: [],
    }
    dispatch({ type: "ADD_INSPECTION", inspection })
    setAddOpen(false)
    toast.success("Inspection record added")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inspections</h1>
          <p className="text-muted-foreground">Run and review equipment inspections</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setAddOpen(true)}>
            <Plus className="mr-1 h-4 w-4" />Add Inspection
          </Button>
          <Button variant="outline" onClick={startBulk}>
            <ListChecks className="mr-1 h-4 w-4" />Bulk Inspect
          </Button>
        </div>
      </div>

      {/* Today's / Upcoming Inspections */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-4 w-4 text-primary" />
            <CardTitle className="text-base">{"Today's"} & Upcoming Inspections</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            const today = new Date("2026-02-14")
            const dueItems = locationEquipment.filter(e => {
              const daysSince = differenceInDays(today, parseISO(e.lastInspectionDate))
              return daysSince >= 7
            }).sort((a, b) => differenceInDays(today, parseISO(a.lastInspectionDate)) - differenceInDays(today, parseISO(b.lastInspectionDate)))

            const categories = [...new Set(dueItems.map(e => e.category))]

            return categories.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">All inspections are up to date</p>
            ) : (
              <div className="flex flex-col gap-3">
                {categories.map(cat => {
                  const catItems = dueItems.filter(e => e.category === cat)
                  const overdue = catItems.filter(e => differenceInDays(today, parseISO(e.lastInspectionDate)) > 14)
                  return (
                    <div key={cat} className="flex items-center justify-between rounded-md border p-3">
                      <div className="flex items-center gap-3">
                        {overdue.length > 0 ? (
                          <AlertTriangle className="h-4 w-4 text-destructive" />
                        ) : (
                          <ClipboardCheck className="h-4 w-4 text-accent" />
                        )}
                        <div>
                          <p className="text-sm font-medium">{cat}</p>
                          <p className="text-xs text-muted-foreground">
                            {catItems.length} due ({overdue.length} overdue)
                          </p>
                        </div>
                      </div>
                      <Button size="sm" variant="outline" className="text-xs" onClick={() => {
                        setBulkCategory(cat)
                        setBulkSelectedIds(catItems.map(e => e.id))
                        setBulkFailedIds([])
                        setBulkFailNotes({})
                        setBulkCurrentFailIdx(0)
                        setBulkStep("select-units")
                        setBulkOpen(true)
                      }}>
                        <ListChecks className="mr-1 h-3 w-3" />Inspect {cat}
                      </Button>
                    </div>
                  )
                })}
              </div>
            )
          })()}
        </CardContent>
      </Card>

      {/* Inspection Templates */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Inspection Templates by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {Object.entries(checklistTemplates).map(([category, items]) => (
              <div key={category} className="rounded-md border p-3">
                <p className="text-sm font-semibold">{category}</p>
                <ul className="mt-1 flex flex-col gap-0.5">
                  {items.map(item => (
                    <li key={item} className="text-xs text-muted-foreground">- {item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Inspect */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Quick Inspect by Unit</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {locationEquipment.slice(0, 12).map(eq => (
              <Button key={eq.id} variant="outline" size="sm" className="text-xs" onClick={() => startInspection(eq.id)}>
                <ClipboardCheck className="mr-1 h-3 w-3" />{eq.serialNumber}
              </Button>
            ))}
            {locationEquipment.length > 12 && (
              <span className="flex items-center text-xs text-muted-foreground">+{locationEquipment.length - 12} more</span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recent Inspections */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent Inspections</h2>
        <DataTable
          data={[...locationInspections].reverse() as unknown as Record<string, unknown>[]}
          columns={columns as { key: string; label: string; render?: (item: Record<string, unknown>) => React.ReactNode }[]}
          searchField={"equipmentId" as keyof Record<string, unknown>}
          searchPlaceholder="Search by equipment..."
          emptyMessage="No inspections recorded"
        />
      </div>

      {/* ---- Single Inspection Dialog ---- */}
      <Dialog open={inspectOpen} onOpenChange={setInspectOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ClipboardCheck className="h-4 w-4" />
              Inspect: {state.equipment.find(e => e.id === selectedEquipId)?.serialNumber}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {checklistState.map((item, idx) => (
              <div key={idx} className="rounded-md border p-3">
                <p className="text-sm font-medium">{item.label}</p>
                <div className="mt-2 flex gap-1">
                  {(["Pass", "Needs Adjustment", "Fail"] as const).map(result => (
                    <Button
                      key={result} type="button" size="sm"
                      variant={item.result === result ? "default" : "outline"}
                      className={`h-7 text-xs ${item.result === result ? result === "Pass" ? "bg-primary text-primary-foreground" : result === "Needs Adjustment" ? "bg-accent text-accent-foreground" : "bg-destructive text-destructive-foreground" : ""}`}
                      onClick={() => {
                        const updated = [...checklistState]
                        updated[idx] = { ...updated[idx], result }
                        setChecklistState(updated)
                      }}
                    >{result}</Button>
                  ))}
                </div>
              </div>
            ))}
            <div className="flex flex-col gap-2">
              <Label>Update Condition (if changed)</Label>
              <Select onValueChange={(val) => {
                if (!selectedEquipId) return
                dispatch({ type: "UPDATE_EQUIPMENT", id: selectedEquipId, updates: { condition: val as "Good" | "Watch" | "Replace" } })
                toast.info(`Condition updated to ${val}`)
              }}>
                <SelectTrigger><SelectValue placeholder="No change..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Good">Good</SelectItem>
                  <SelectItem value="Watch">Watch</SelectItem>
                  <SelectItem value="Replace">Replace</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Notes</Label>
              <Textarea value={inspNotes} onChange={(e) => setInspNotes(e.target.value)} placeholder="Additional observations..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInspectOpen(false)}>Cancel</Button>
            <Button onClick={submitInspection}>Submit Inspection</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ---- Bulk Inspection Dialog ---- */}
      <Dialog open={bulkOpen} onOpenChange={setBulkOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ListChecks className="h-4 w-4" />Bulk Inspection
            </DialogTitle>
          </DialogHeader>

          {bulkStep === "select-category" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">Select the equipment category to inspect in bulk.</p>
              <Select value={bulkCategory} onValueChange={setBulkCategory}>
                <SelectTrigger><SelectValue placeholder="Choose category..." /></SelectTrigger>
                <SelectContent>
                  {Object.keys(checklistTemplates).map(c => {
                    const count = locationEquipment.filter(e => e.category === c).length
                    return <SelectItem key={c} value={c}>{c} ({count} units)</SelectItem>
                  })}
                </SelectContent>
              </Select>
              <DialogFooter>
                <Button disabled={!bulkCategory} onClick={() => {
                  setBulkSelectedIds(bulkCategoryEquipment.map(e => e.id))
                  setBulkStep("select-units")
                }}>Next: Select Units</Button>
              </DialogFooter>
            </div>
          )}

          {bulkStep === "select-units" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">Select which {bulkCategory} units were inspected ({bulkSelectedIds.length} selected).</p>

              {/* Inspection criteria reference for this category */}
              {bulkCategory && checklistTemplates[bulkCategory] && (
                <div className="rounded-md border bg-muted/30 p-3">
                  <p className="text-xs font-semibold mb-1">Inspection Criteria for {bulkCategory}:</p>
                  <ol className="flex flex-col gap-0.5 text-xs text-muted-foreground list-decimal list-inside">
                    {checklistTemplates[bulkCategory].map((item, i) => (
                      <li key={i}>{item}</li>
                    ))}
                  </ol>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {bulkCategoryEquipment.map(eq => (
                  <label key={eq.id} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-muted/50">
                    <Checkbox
                      checked={bulkSelectedIds.includes(eq.id)}
                      onCheckedChange={(checked) => {
                        setBulkSelectedIds(prev => checked ? [...prev, eq.id] : prev.filter(id => id !== eq.id))
                      }}
                    />
                    <span className="font-mono text-xs">{eq.serialNumber}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setBulkSelectedIds(bulkCategoryEquipment.map(e => e.id))}>Select All</Button>
                <Button variant="outline" size="sm" onClick={() => setBulkSelectedIds([])}>Clear</Button>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBulkStep("select-category")}>Back</Button>
                <Button disabled={bulkSelectedIds.length === 0} onClick={bulkSubmitPassed}>Next: Mark Failures</Button>
              </DialogFooter>
            </div>
          )}

          {bulkStep === "mark-failures" && (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-muted-foreground">Did any units fail or need adjustment? Select them below. Leave unchecked if all passed.</p>
              <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                {bulkSelectedIds.map(eqId => {
                  const eq = state.equipment.find(e => e.id === eqId)
                  return (
                    <label key={eqId} className="flex items-center gap-2 rounded-md border p-2 cursor-pointer hover:bg-muted/50">
                      <Checkbox
                        checked={bulkFailedIds.includes(eqId)}
                        onCheckedChange={(checked) => {
                          setBulkFailedIds(prev => checked ? [...prev, eqId] : prev.filter(id => id !== eqId))
                        }}
                      />
                      <span className="font-mono text-xs">{eq?.serialNumber}</span>
                    </label>
                  )
                })}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setBulkStep("select-units")}>Back</Button>
                <Button onClick={bulkConfirmFailures}>
                  {bulkFailedIds.length === 0 ? "Submit All as Passed" : `Detail ${bulkFailedIds.length} Issue(s)`}
                </Button>
              </DialogFooter>
            </div>
          )}

          {bulkStep === "detail-failures" && bulkFailedIds[bulkCurrentFailIdx] && (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium">
                Issue {bulkCurrentFailIdx + 1} of {bulkFailedIds.length}:{" "}
                <span className="font-mono">{state.equipment.find(e => e.id === bulkFailedIds[bulkCurrentFailIdx])?.serialNumber}</span>
              </p>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-2">
                  <Label>Result</Label>
                  <Select
                    value={bulkFailNotes[bulkFailedIds[bulkCurrentFailIdx]]?.result || "Fail"}
                    onValueChange={(val) => {
                      setBulkFailNotes(prev => ({
                        ...prev,
                        [bulkFailedIds[bulkCurrentFailIdx]]: {
                          ...prev[bulkFailedIds[bulkCurrentFailIdx]],
                          result: val as ResultVal,
                        }
                      }))
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Needs Adjustment">Needs Adjustment</SelectItem>
                      <SelectItem value="Fail">Fail</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Describe the issue</Label>
                  <Textarea
                    value={bulkFailNotes[bulkFailedIds[bulkCurrentFailIdx]]?.notes || ""}
                    onChange={(e) => {
                      setBulkFailNotes(prev => ({
                        ...prev,
                        [bulkFailedIds[bulkCurrentFailIdx]]: {
                          ...prev[bulkFailedIds[bulkCurrentFailIdx]],
                          result: prev[bulkFailedIds[bulkCurrentFailIdx]]?.result || "Fail",
                          notes: e.target.value,
                        }
                      }))
                    }}
                    rows={3}
                    placeholder="What's wrong with this unit?"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => {
                  if (bulkCurrentFailIdx > 0) setBulkCurrentFailIdx(prev => prev - 1)
                  else setBulkStep("mark-failures")
                }}>Back</Button>
                <Button onClick={bulkNextFail}>
                  {bulkCurrentFailIdx < bulkFailedIds.length - 1 ? "Next Unit" : "Finish & Submit"}
                </Button>
              </DialogFooter>
            </div>
          )}

          {bulkStep === "done" && (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <ClipboardCheck className="h-8 w-8 text-primary" />
              </div>
              <p className="text-lg font-semibold">Bulk Inspection Complete</p>
              <p className="text-sm text-muted-foreground">{bulkSelectedIds.length} units inspected, {bulkFailedIds.length} issues flagged</p>
              <Button onClick={() => setBulkOpen(false)}>Done</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ---- Manual Add Inspection Dialog ---- */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Inspection Record</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleManualAdd} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Inspection Type</Label>
                <Select name="inspType" defaultValue="Routine">
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Routine">Routine</SelectItem>
                    <SelectItem value="Annual">Annual</SelectItem>
                    <SelectItem value="Manufacturer">Manufacturer</SelectItem>
                    <SelectItem value="Regulatory">State / Regulatory</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-2">
                <Label>Result</Label>
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
            <div className="flex flex-col gap-2">
              <Label>Equipment (optional)</Label>
              <Select name="equipmentId">
                <SelectTrigger><SelectValue placeholder="Select equipment..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">N/A - General / System</SelectItem>
                  {locationEquipment.map(eq => (
                    <SelectItem key={eq.id} value={eq.id}>{eq.serialNumber} - {eq.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Inspector Name</Label>
                <Input name="inspectorName" placeholder="e.g., John Smith" />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Date</Label>
                <Input name="date" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Company Name (if external)</Label>
              <Input name="companyName" placeholder="e.g., NC State Inspector" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Regulatory Standards Met</Label>
              <Input name="regulatory" placeholder="e.g., ACCT, OSHA, State" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Notes</Label>
              <Textarea name="notes" rows={3} placeholder="Inspection observations..." />
            </div>
            <div className="flex h-16 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Upload className="h-4 w-4" />Upload inspection report
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">Add Record</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
