"use client"

import { useMemo } from "react"
import { format, parseISO, differenceInDays } from "date-fns"
import { ClipboardCheck, Wrench, AlertTriangle, Award, ArrowRight, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { KPIStatCard } from "@/components/kpi-stat-card"
import { StatusBadge } from "@/components/status-badge"
import { useAppStore } from "@/lib/mock-store"
import { staff, certificates } from "@/lib/mock-data"
import type { EquipmentItem, MaintenanceTask, Certificate } from "@/lib/types"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

type DetailItem = { type: "equipment"; data: EquipmentItem } | { type: "maintenance"; data: MaintenanceTask } | { type: "certificate"; data: Certificate }

export default function AdminDashboardPage() {
  const { state } = useAppStore()
  const router = useRouter()
  const today = new Date()
  const [detail, setDetail] = useState<DetailItem | null>(null)

  const locationEquipment = state.equipment.filter(e => e.locationId === state.selectedLocationId)
  const locationInspections = state.inspections.filter(i =>
    locationEquipment.some(e => e.id === i.equipmentId)
  )

  const inspectionsDue = locationEquipment.filter(e => {
    const daysSince = differenceInDays(today, parseISO(e.lastInspectionDate))
    return daysSince > 7 && e.status === "Active"
  })

  const inspectionsOverdue = locationEquipment.filter(e => {
    const daysSince = differenceInDays(today, parseISO(e.lastInspectionDate))
    return daysSince > 14 && e.status === "Active"
  })

  const recentFailures = locationInspections.filter(i =>
    (i.overallResult === "Fail" || i.overallResult === "Needs Adjustment") &&
    differenceInDays(today, parseISO(i.date)) <= 30
  )

  const openMaintenance = state.maintenance.filter(m =>
    m.status === "Open" || m.status === "In Progress" || m.status === "Waiting Parts"
  )

  const expiringCerts = certificates.filter(c =>
    c.status === "Expiring Soon" || c.status === "Expired"
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Back-end Dashboard</h1>
        <p className="text-muted-foreground">Equipment, inspections, and compliance overview</p>
      </div>

      {/* Clickable KPI Tiles */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <button className="text-left" onClick={() => router.push("/admin/inspections")}>
          <KPIStatCard
            label="Inspections Due"
            value={inspectionsDue.length}
            trend={inspectionsOverdue.length > 0 ? "down" : "flat"}
            trendValue={`${inspectionsOverdue.length} overdue`}
            icon={<ClipboardCheck className="h-4 w-4" />}
          />
        </button>
        <button className="text-left" onClick={() => router.push("/admin/inspections")}>
          <KPIStatCard
            label="Failed / Adjust"
            value={recentFailures.length}
            trend={recentFailures.length > 2 ? "down" : "flat"}
            trendValue="last 30 days"
            icon={<AlertTriangle className="h-4 w-4" />}
          />
        </button>
        <button className="text-left" onClick={() => router.push("/admin/maintenance")}>
          <KPIStatCard
            label="Open Maintenance"
            value={openMaintenance.length}
            trend={openMaintenance.filter(m => m.priority === "Critical").length > 0 ? "down" : "flat"}
            trendValue={`${openMaintenance.filter(m => m.priority === "Critical").length} critical`}
            icon={<Wrench className="h-4 w-4" />}
          />
        </button>
        <button className="text-left" onClick={() => router.push("/admin/certificates")}>
          <KPIStatCard
            label="Cert Alerts"
            value={expiringCerts.length}
            trend={expiringCerts.filter(c => c.status === "Expired").length > 0 ? "down" : "flat"}
            trendValue={`${expiringCerts.filter(c => c.status === "Expired").length} expired`}
            icon={<Award className="h-4 w-4" />}
          />
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Overdue Inspections - clickable items */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Overdue Inspections</CardTitle>
              <Link href="/admin/inspections" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">View all <ArrowRight className="h-3 w-3" /></Link>
            </div>
          </CardHeader>
          <CardContent>
            {inspectionsDue.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">All inspections up to date</p>
            ) : (
              <div className="flex flex-col gap-2">
                {inspectionsDue.slice(0, 5).map(eq => {
                  const daysSince = differenceInDays(today, parseISO(eq.lastInspectionDate))
                  return (
                    <button
                      key={eq.id}
                      className="flex items-center justify-between rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
                      onClick={() => setDetail({ type: "equipment", data: eq })}
                    >
                      <div>
                        <p className="text-sm font-medium">{eq.serialNumber}</p>
                        <p className="text-xs text-muted-foreground">{eq.name} - {eq.category}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">{daysSince} days ago</span>
                        <StatusBadge status={daysSince > 14 ? "Critical" : "Medium"} />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Open Maintenance - clickable items */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Open Maintenance Tasks</CardTitle>
              <Link href="/admin/maintenance" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">View all <ArrowRight className="h-3 w-3" /></Link>
            </div>
          </CardHeader>
          <CardContent>
            {openMaintenance.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">No open maintenance tasks</p>
            ) : (
              <div className="flex flex-col gap-2">
                {openMaintenance.slice(0, 5).map(task => (
                  <button
                    key={task.id}
                    className="flex items-center justify-between rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
                    onClick={() => setDetail({ type: "maintenance", data: task })}
                  >
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="text-xs text-muted-foreground">{task.description.slice(0, 60)}...</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={task.priority} />
                      <StatusBadge status={task.status} />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Certificates - clickable items */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Certificate Alerts</CardTitle>
              <Link href="/admin/certificates" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">View all <ArrowRight className="h-3 w-3" /></Link>
            </div>
          </CardHeader>
          <CardContent>
            {expiringCerts.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">All certificates current</p>
            ) : (
              <div className="flex flex-col gap-2">
                {expiringCerts.map(cert => {
                  const staffMember = staff.find(s => s.id === cert.staffId)
                  return (
                    <button
                      key={cert.id}
                      className="flex items-center justify-between rounded-md border p-3 text-left transition-colors hover:bg-muted/50"
                      onClick={() => setDetail({ type: "certificate", data: cert })}
                    >
                      <div>
                        <p className="text-sm font-medium">{staffMember?.name || cert.staffId}</p>
                        <p className="text-xs text-muted-foreground">{cert.type}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Exp: {format(parseISO(cert.expiryDate), "MMM d, yyyy")}</span>
                        <StatusBadge status={cert.status} />
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Equipment Overview */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Equipment Overview</CardTitle>
              <Link href="/admin/equipment-inventory" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">Inventory <ArrowRight className="h-3 w-3" /></Link>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-3">
              {(["Active", "Quarantined", "Retired"] as const).map(status => {
                const count = locationEquipment.filter(e => e.status === status).length
                return (
                  <div key={status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={status} />
                      <span className="text-sm">{status} equipment</span>
                    </div>
                    <span className="text-lg font-bold">{count}</span>
                  </div>
                )
              })}
              <div className="border-t pt-3">
                {(["Good", "Watch", "Replace"] as const).map(condition => {
                  const count = locationEquipment.filter(e => e.condition === condition).length
                  return (
                    <div key={condition} className="flex items-center justify-between py-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={condition} />
                        <span className="text-sm">Condition: {condition}</span>
                      </div>
                      <span className="font-semibold">{count}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detail Side Sheet */}
      <Sheet open={!!detail} onOpenChange={(o) => { if (!o) setDetail(null) }}>
        <SheetContent className="w-[400px] sm:w-[500px] overflow-y-auto">
          {detail?.type === "equipment" && (
            <>
              <SheetHeader>
                <SheetTitle className="font-mono">{detail.data.serialNumber}</SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  <StatusBadge status={detail.data.status} />
                  <StatusBadge status={detail.data.condition} />
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{detail.data.name}</span>
                  <span className="text-muted-foreground">Category</span>
                  <span className="font-medium">{detail.data.category}</span>
                  <span className="text-muted-foreground">Manufacturer</span>
                  <span className="font-medium">{detail.data.manufacturer}</span>
                  <span className="text-muted-foreground">Model</span>
                  <span className="font-medium">{detail.data.model}</span>
                  <span className="text-muted-foreground">Last Inspected</span>
                  <span className="font-medium">{format(parseISO(detail.data.lastInspectionDate), "MMM d, yyyy")}</span>
                  <span className="text-muted-foreground">Days Since</span>
                  <span className="font-medium text-destructive">{differenceInDays(today, parseISO(detail.data.lastInspectionDate))} days</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" onClick={() => { setDetail(null); router.push(`/admin/equipment-inventory/${detail.data.id}`) }}>
                    View Full Details
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => { setDetail(null); router.push("/admin/inspections") }}>
                    <ClipboardCheck className="mr-1 h-3 w-3" />Run Inspection
                  </Button>
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
                  <span className="text-muted-foreground">Assigned To</span>
                  <span className="font-medium">{staff.find(s => s.id === detail.data.assignedToId)?.name || "Unassigned"}</span>
                  <span className="text-muted-foreground">Created</span>
                  <span>{format(parseISO(detail.data.createdAt), "MMM d, yyyy")}</span>
                  {detail.data.partsUsed.length > 0 && (
                    <>
                      <span className="text-muted-foreground">Parts</span>
                      <span>{detail.data.partsUsed.join(", ")}</span>
                    </>
                  )}
                </div>
                <Button size="sm" onClick={() => {
                  const equipId = detail.data.equipmentId
                  setDetail(null)
                  router.push(`/admin/equipment-inventory/${equipId}`)
                }}>
                  View Equipment Page
                </Button>
                <Button size="sm" variant="outline" onClick={() => { setDetail(null); router.push("/admin/maintenance") }}>
                  Go to Maintenance
                </Button>
              </div>
            </>
          )}
          {detail?.type === "certificate" && (
            <>
              <SheetHeader>
                <SheetTitle>{staff.find(s => s.id === detail.data.staffId)?.name || detail.data.staffId}</SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  {detail.data.type}
                  <StatusBadge status={detail.data.status} />
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <span className="text-muted-foreground">Certificate</span>
                  <span className="font-medium">{detail.data.type}</span>
                  <span className="text-muted-foreground">Issued</span>
                  <span>{format(parseISO(detail.data.issueDate), "MMM d, yyyy")}</span>
                  <span className="text-muted-foreground">Expires</span>
                  <span className="font-medium text-destructive">{format(parseISO(detail.data.expiryDate), "MMM d, yyyy")}</span>
                  <span className="text-muted-foreground">Days Remaining</span>
                  <span className="font-medium">{differenceInDays(parseISO(detail.data.expiryDate), today)}</span>
                </div>
                <Button size="sm" onClick={() => { setDetail(null); router.push("/admin/certificates") }}>
                  Go to Certificates
                </Button>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}
