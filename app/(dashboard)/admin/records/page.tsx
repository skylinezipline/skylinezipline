"use client"

import { useState } from "react"
import { format, parseISO } from "date-fns"
import { Download, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { DataTable } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { useAppStore } from "@/lib/mock-store"
import { staff, certificates } from "@/lib/mock-data"
import type { Inspection, MaintenanceTask, Certificate } from "@/lib/types"
import { toast } from "sonner"

type DetailItem = { type: "inspection"; data: Inspection } | { type: "maintenance"; data: MaintenanceTask } | { type: "certificate"; data: Certificate }

export default function RecordsPage() {
  const { state } = useAppStore()
  const [searchBy, setSearchBy] = useState<"all" | "date" | "inspector" | "unit">("all")
  const [search, setSearch] = useState("")
  const [detail, setDetail] = useState<DetailItem | null>(null)
  const [regDetail, setRegDetail] = useState<Record<string, unknown> | null>(null)

  function filterInspections(list: Inspection[]) {
    if (!search) return list
    const q = search.toLowerCase()
    return list.filter(i => {
      const eq = state.equipment.find(e => e.id === i.equipmentId)
      const insp = staff.find(s => s.id === i.inspectorId)
      if (searchBy === "date") return i.date.includes(q)
      if (searchBy === "inspector") return insp?.name.toLowerCase().includes(q) || i.inspectorId.toLowerCase().includes(q)
      if (searchBy === "unit") return eq?.serialNumber.toLowerCase().includes(q) || eq?.name.toLowerCase().includes(q)
      return (
        i.date.includes(q) ||
        eq?.serialNumber.toLowerCase().includes(q) ||
        insp?.name.toLowerCase().includes(q) ||
        i.type.toLowerCase().includes(q)
      )
    })
  }

  function filterMaintenance(list: MaintenanceTask[]) {
    if (!search) return list
    const q = search.toLowerCase()
    return list.filter(m => {
      const eq = state.equipment.find(e => e.id === m.equipmentId)
      const assignee = staff.find(s => s.id === m.assignedToId)
      if (searchBy === "date") return m.createdAt.includes(q) || (m.completedAt || "").includes(q)
      if (searchBy === "inspector") return assignee?.name.toLowerCase().includes(q)
      if (searchBy === "unit") return eq?.serialNumber.toLowerCase().includes(q)
      return m.title.toLowerCase().includes(q) || eq?.serialNumber.toLowerCase().includes(q) || assignee?.name.toLowerCase().includes(q)
    })
  }

  function filterCerts(list: Certificate[]) {
    if (!search) return list
    const q = search.toLowerCase()
    return list.filter(c => {
      const s = staff.find(st => st.id === c.staffId)
      return s?.name.toLowerCase().includes(q) || c.type.toLowerCase().includes(q)
    })
  }

  const inspColumns = [
    { key: "date", label: "Date", render: (i: Inspection) => format(parseISO(i.date), "MMM d, yyyy") },
    { key: "equipmentId", label: "Equipment", render: (i: Inspection) => {
      const eq = state.equipment.find(e => e.id === i.equipmentId)
      return eq ? <span className="font-mono text-xs">{eq.serialNumber}</span> : i.equipmentId
    }},
    { key: "type", label: "Type" },
    { key: "overallResult", label: "Result", render: (i: Inspection) => <StatusBadge status={i.overallResult} /> },
    { key: "inspectorId", label: "Inspector", render: (i: Inspection) => staff.find(s => s.id === i.inspectorId)?.name || "-" },
  ]

  const maintColumns = [
    { key: "title", label: "Task", render: (m: MaintenanceTask) => <span className="font-medium">{m.title}</span> },
    { key: "status", label: "Status", render: (m: MaintenanceTask) => <StatusBadge status={m.status} /> },
    { key: "priority", label: "Priority", render: (m: MaintenanceTask) => <StatusBadge status={m.priority} /> },
    { key: "createdAt", label: "Created", render: (m: MaintenanceTask) => format(parseISO(m.createdAt), "MMM d, yyyy") },
    { key: "completedAt", label: "Completed", render: (m: MaintenanceTask) => m.completedAt ? format(parseISO(m.completedAt), "MMM d") : "-" },
  ]

  const certColumns = [
    { key: "staffId", label: "Staff", render: (c: Certificate) => staff.find(s => s.id === c.staffId)?.name || c.staffId },
    { key: "type", label: "Certificate" },
    { key: "issueDate", label: "Issued", render: (c: Certificate) => format(parseISO(c.issueDate), "MMM d, yyyy") },
    { key: "expiryDate", label: "Expires", render: (c: Certificate) => format(parseISO(c.expiryDate), "MMM d, yyyy") },
    { key: "status", label: "Status", render: (c: Certificate) => <StatusBadge status={c.status} /> },
  ]

  const annualInspections = state.inspections.filter(i => i.type === "Annual")
  const regulatoryRecords = [
    { id: "reg-1", type: "State Inspection", date: "2025-06-15", inspector: "NC State Inspector", result: "Pass", notes: "Annual state compliance check" },
    { id: "reg-2", type: "ACCT Audit", date: "2025-09-20", inspector: "ACCT Auditor", result: "Pass", notes: "ACCT standards compliance" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Records Archive</h1>
          <p className="text-muted-foreground">Historical records for compliance and auditing</p>
        </div>
        <Button variant="outline" onClick={() => toast.info("Export would download")}>
          <Download className="mr-2 h-4 w-4" />Export Records
        </Button>
      </div>

      {/* Search controls */}
      <div className="flex flex-wrap items-center gap-2">
        <Select value={searchBy} onValueChange={(v) => setSearchBy(v as typeof searchBy)}>
          <SelectTrigger className="w-32 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Search All</SelectItem>
            <SelectItem value="date">By Date</SelectItem>
            <SelectItem value="inspector">By Inspector</SelectItem>
            <SelectItem value="unit">By Unit ID</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={searchBy === "date" ? "YYYY-MM-DD..." : searchBy === "inspector" ? "Inspector name..." : searchBy === "unit" ? "Serial number..." : "Search records..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-64 pl-8 h-9"
          />
        </div>
      </div>

      <Tabs defaultValue="inspections">
        <TabsList className="flex-wrap">
          <TabsTrigger value="inspections">Inspections</TabsTrigger>
          <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
          <TabsTrigger value="certificates">Staff Certs</TabsTrigger>
          <TabsTrigger value="waivers">Waivers</TabsTrigger>
          <TabsTrigger value="annual">Annual / Manufacturer</TabsTrigger>
          <TabsTrigger value="regulatory">State / Regulatory</TabsTrigger>
        </TabsList>

        <TabsContent value="inspections" className="mt-4">
          <DataTable
            data={filterInspections([...state.inspections].reverse()) as unknown as Record<string, unknown>[]}
            columns={inspColumns as { key: string; label: string; render?: (item: Record<string, unknown>) => React.ReactNode }[]}
            emptyMessage="No inspection records"
            onRowClick={(item) => setDetail({ type: "inspection", data: item as unknown as Inspection })}
          />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4">
          <DataTable
            data={filterMaintenance(state.maintenance.filter(m => m.status === "Completed" || m.status === "Verified")) as unknown as Record<string, unknown>[]}
            columns={maintColumns as { key: string; label: string; render?: (item: Record<string, unknown>) => React.ReactNode }[]}
            emptyMessage="No completed maintenance records"
            onRowClick={(item) => setDetail({ type: "maintenance", data: item as unknown as MaintenanceTask })}
          />
        </TabsContent>

        <TabsContent value="certificates" className="mt-4">
          <DataTable
            data={filterCerts(certificates) as unknown as Record<string, unknown>[]}
            columns={certColumns as { key: string; label: string; render?: (item: Record<string, unknown>) => React.ReactNode }[]}
            emptyMessage="No certificate records"
            onRowClick={(item) => setDetail({ type: "certificate", data: item as unknown as Certificate })}
          />
        </TabsContent>

        <TabsContent value="waivers" className="mt-4">
          <div className="rounded-lg border p-6 text-center">
            <p className="text-sm font-medium mb-2">Waiver records are stored securely with the digital waiver provider.</p>
            <p className="text-xs text-muted-foreground mb-4">Integration with waiver provider (e.g., Smartwaiver, WaiverForever) will sync signed waivers and store them for compliance.</p>
            <div className="flex flex-col gap-2 max-w-sm mx-auto">
              {[
                { name: "Sarah Johnson", date: "Feb 14, 2026", status: "Signed" },
                { name: "Mike Chen", date: "Feb 14, 2026", status: "Signed" },
                { name: "Emma Wilson", date: "Feb 13, 2026", status: "Signed" },
                { name: "James Lee (Minor - covered by parent)", date: "Feb 13, 2026", status: "Covered" },
              ].map((w, i) => (
                <div key={i} className="flex items-center justify-between rounded-md border p-2 text-sm">
                  <div>
                    <span className="font-medium">{w.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{w.date}</span>
                  </div>
                  <StatusBadge status={w.status} />
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">Waivers are retained for 7 years per legal requirements.</p>
          </div>
        </TabsContent>

        <TabsContent value="annual" className="mt-4">
          <DataTable
            data={filterInspections(annualInspections) as unknown as Record<string, unknown>[]}
            columns={inspColumns as { key: string; label: string; render?: (item: Record<string, unknown>) => React.ReactNode }[]}
            emptyMessage="No annual inspection records"
            onRowClick={(item) => setDetail({ type: "inspection", data: item as unknown as Inspection })}
          />
        </TabsContent>

        <TabsContent value="regulatory" className="mt-4">
          <DataTable
            data={regulatoryRecords as unknown as Record<string, unknown>[]}
            columns={[
              { key: "type", label: "Type" },
              { key: "date", label: "Date" },
              { key: "inspector", label: "Inspector" },
              { key: "result", label: "Result", render: (r: Record<string, unknown>) => <StatusBadge status={String(r.result)} /> },
              { key: "notes", label: "Notes" },
            ]}
            emptyMessage="No regulatory records"
            onRowClick={(item) => setRegDetail(item)}
          />
        </TabsContent>
      </Tabs>

      {/* Detail Sheet */}
      <Sheet open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null) }}>
        <SheetContent className="w-[400px] sm:w-[500px] overflow-y-auto">
          {detail?.type === "inspection" && (
            <>
              <SheetHeader>
                <SheetTitle>Inspection Details</SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  {format(parseISO(detail.data.date), "MMMM d, yyyy")}
                  <StatusBadge status={detail.data.overallResult} />
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <span className="text-muted-foreground">Equipment</span>
                  <span className="font-mono text-xs">{state.equipment.find(e => e.id === detail.data.equipmentId)?.serialNumber || detail.data.equipmentId}</span>
                  <span className="text-muted-foreground">Type</span>
                  <span>{detail.data.type}</span>
                  <span className="text-muted-foreground">Inspector</span>
                  <span>{staff.find(s => s.id === detail.data.inspectorId)?.name || detail.data.inspectorId}</span>
                </div>
                {detail.data.notes && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Notes</h4>
                    <p className="text-sm text-muted-foreground">{detail.data.notes}</p>
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-semibold mb-2">Checklist</h4>
                  <div className="flex flex-col gap-2">
                    {detail.data.checklist.map(item => (
                      <div key={item.id} className="flex items-center justify-between rounded-md border p-2">
                        <span className="text-sm">{item.label}</span>
                        <StatusBadge status={item.result} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
          {detail?.type === "maintenance" && (
            <>
              <SheetHeader>
                <SheetTitle>{detail.data.title}</SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  <StatusBadge status={detail.data.status} />
                  <StatusBadge status={detail.data.priority} />
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                <p className="text-sm">{detail.data.description}</p>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <span className="text-muted-foreground">Equipment</span>
                  <span className="font-mono text-xs">{state.equipment.find(e => e.id === detail.data.equipmentId)?.serialNumber || detail.data.equipmentId}</span>
                  <span className="text-muted-foreground">Assigned</span>
                  <span>{staff.find(s => s.id === detail.data.assignedToId)?.name || "Unassigned"}</span>
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(parseISO(detail.data.createdAt), "MMM d, yyyy")}</span>
                  {detail.data.completedAt && (
                    <>
                      <span className="text-muted-foreground">Completed</span>
                      <span>{format(parseISO(detail.data.completedAt), "MMM d, yyyy")}</span>
                    </>
                  )}
                </div>
                {detail.data.partsUsed.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-1">Parts Used</h4>
                    <ul className="text-sm">{detail.data.partsUsed.map((p, i) => <li key={i}>- {p}</li>)}</ul>
                  </div>
                )}
              </div>
            </>
          )}
          {detail?.type === "certificate" && (
            <>
              <SheetHeader>
                <SheetTitle>{staff.find(s => s.id === detail.data.staffId)?.name}</SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  {detail.data.type} <StatusBadge status={detail.data.status} />
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 grid grid-cols-2 gap-y-3 text-sm">
                <span className="text-muted-foreground">Certificate</span>
                <span>{detail.data.type}</span>
                <span className="text-muted-foreground">Issued</span>
                <span>{format(parseISO(detail.data.issueDate), "MMM d, yyyy")}</span>
                <span className="text-muted-foreground">Expires</span>
                <span>{format(parseISO(detail.data.expiryDate), "MMM d, yyyy")}</span>
                <span className="text-muted-foreground">Status</span>
                <span><StatusBadge status={detail.data.status} /></span>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Regulatory Detail Sheet */}
      <Sheet open={!!regDetail} onOpenChange={(o) => { if (!o) setRegDetail(null) }}>
        <SheetContent className="w-[400px] sm:w-[500px] overflow-y-auto">
          {regDetail && (
            <>
              <SheetHeader>
                <SheetTitle>{String(regDetail.type)}</SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  {String(regDetail.date)} <StatusBadge status={String(regDetail.result)} />
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <span className="text-muted-foreground">Inspector</span>
                  <span>{String(regDetail.inspector)}</span>
                  <span className="text-muted-foreground">Date</span>
                  <span>{String(regDetail.date)}</span>
                  <span className="text-muted-foreground">Result</span>
                  <span><StatusBadge status={String(regDetail.result)} /></span>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">Notes</h4>
                  <p className="text-sm text-muted-foreground">{String(regDetail.notes)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-semibold mb-1">Documents</h4>
                  <p className="text-xs text-muted-foreground">Supporting documents would be attached here.</p>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
