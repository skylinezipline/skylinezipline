"use client"

import { useState } from "react"
import { format, parseISO, differenceInDays } from "date-fns"
import { Upload, Bell, Plus, Eye, EyeOff, Pencil } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { DataTable } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { certificates, staff } from "@/lib/mock-data"
import type { Certificate } from "@/lib/types"
import { toast } from "sonner"

const certTypes = ["Zipline Guide Level 1", "Zipline Guide Level 2", "First Aid / CPR", "High Angle Rescue", "ACCT Inspector"]

export default function CertificatesPage() {
  const [reminderDays, setReminderDays] = useState(30)
  const [uploadOpen, setUploadOpen] = useState(false)
  const [uploadCert, setUploadCert] = useState<Certificate | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [showAll, setShowAll] = useState(false)
  const [localCerts, setLocalCerts] = useState(certificates)
  const [hiddenIds, setHiddenIds] = useState<string[]>([])
  const [detailCert, setDetailCert] = useState<Certificate | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [customCertType, setCustomCertType] = useState("")

  const columns = [
    { key: "staffId", label: "Staff Member", render: (c: Certificate) => {
      const s = staff.find(st => st.id === c.staffId)
      return (
        <div>
          <span className="font-medium">{s?.name || c.staffId}</span>
          <p className="text-xs text-muted-foreground">{s?.role}</p>
        </div>
      )
    }},
    { key: "type", label: "Certificate" },
    { key: "issueDate", label: "Issued", render: (c: Certificate) => format(parseISO(c.issueDate), "MMM d, yyyy") },
    { key: "expiryDate", label: "Expires", render: (c: Certificate) => {
      const daysLeft = differenceInDays(parseISO(c.expiryDate), new Date())
      return (
        <div>
          <span>{format(parseISO(c.expiryDate), "MMM d, yyyy")}</span>
          {daysLeft > 0 && <p className="text-xs text-muted-foreground">{daysLeft} days left</p>}
        </div>
      )
    }},
    { key: "status", label: "Status", render: (c: Certificate) => <StatusBadge status={c.status} /> },
    { key: "actions", label: "", render: (c: Certificate) => (
      <Button size="sm" variant="ghost" className="h-7" onClick={(e) => { e.stopPropagation(); setUploadCert(c); setUploadOpen(true) }}>
        <Upload className="h-3 w-3" />
      </Button>
    )},
  ]

  // Filter certs
  const displayCerts = localCerts
    .filter(c => !hiddenIds.includes(c.id) || showAll)
    .filter(c => statusFilter === "all" || c.status === statusFilter)

  const validCount = localCerts.filter(c => c.status === "Valid").length
  const expiringCount = localCerts.filter(c => c.status === "Expiring Soon").length
  const expiredCount = localCerts.filter(c => c.status === "Expired").length

  function handleAddCert(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const certType = String(fd.get("certType") || "")
    const finalType = certType === "Other" ? customCertType : certType
    const newCert: Certificate = {
      id: `cert-${Date.now()}`,
      staffId: String(fd.get("staffId") || ""),
      type: finalType || "Unknown",
      issueDate: String(fd.get("issueDate") || format(new Date(), "yyyy-MM-dd")),
      expiryDate: String(fd.get("expiryDate") || ""),
      status: "Valid",
    }
    setLocalCerts(prev => [newCert, ...prev])
    toast.success("Certificate added successfully")
    setCustomCertType("")
    setAddOpen(false)
  }

  function handleUpload(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    toast.success(`Certificate uploaded for ${staff.find(s => s.id === uploadCert?.staffId)?.name}`)
    setUploadOpen(false)
    setUploadCert(null)
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Certificates</h1>
          <p className="text-muted-foreground">Track staff certifications and expiry dates</p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />Add Certificate
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{validCount}</p>
            <p className="text-sm text-muted-foreground">Valid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">{expiringCount}</p>
            <p className="text-sm text-muted-foreground">Expiring Soon</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">{expiredCount}</p>
            <p className="text-sm text-muted-foreground">Expired</p>
          </CardContent>
        </Card>
      </div>

      {/* Status Filter + Show All Toggle */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="Valid">Valid Only</SelectItem>
            <SelectItem value="Expiring Soon">Expiring Soon Only</SelectItem>
            <SelectItem value="Expired">Expired Only</SelectItem>
          </SelectContent>
        </Select>
        <Button variant={showAll ? "default" : "outline"} size="sm" onClick={() => setShowAll(!showAll)}>
          {showAll ? "Showing All (incl. hidden)" : "Show All"}
        </Button>
      </div>

      <DataTable
        data={displayCerts as unknown as Record<string, unknown>[]}
        columns={columns as { key: string; label: string; render?: (item: Record<string, unknown>) => React.ReactNode }[]}
        searchField={"type" as keyof Record<string, unknown>}
        searchPlaceholder="Search certificates..."
        onRowClick={(item) => { setDetailCert(item as unknown as Certificate); setEditMode(false) }}
      />

      {/* Reminder Settings */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" />Reminder Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end gap-4">
            <div className="flex flex-col gap-2">
              <Label>Days before expiry to notify</Label>
              <Input
                type="number"
                value={reminderDays}
                onChange={(e) => setReminderDays(Number(e.target.value))}
                min={7}
                max={180}
                className="w-32"
              />
            </div>
            <Button onClick={() => toast.success(`Reminders set to ${reminderDays} days before expiry`)}>
              Save Settings
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Staff and managers will receive email notifications when certificates are within {reminderDays} days of expiry.
          </p>
        </CardContent>
      </Card>

      {/* Upload Dialog (enhanced with cert date, expiry, notes) */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Upload Certificate</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpload} className="flex flex-col gap-4">
            {uploadCert && (
              <div className="rounded-md bg-muted/50 p-3 text-sm">
                <p className="font-medium">{staff.find(s => s.id === uploadCert.staffId)?.name}</p>
                <p className="text-muted-foreground">{uploadCert.type}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Certification Date</Label>
                <Input name="certDate" type="date" defaultValue={uploadCert ? uploadCert.issueDate : format(new Date(), "yyyy-MM-dd")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Expiry Date</Label>
                <Input name="expiryDate" type="date" defaultValue={uploadCert?.expiryDate || ""} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Notes</Label>
              <Textarea name="notes" rows={2} placeholder="Any relevant notes about this certification..." />
            </div>
            <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20">
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-6 w-6" />
                <span className="text-xs">Drop certificate file here or click to browse</span>
                <span className="text-[10px] text-muted-foreground/70">PDF, JPG, PNG</span>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setUploadOpen(false)}>Cancel</Button>
              <Button type="submit">Upload</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Certificate Detail Sheet */}
      <Sheet open={!!detailCert} onOpenChange={(o) => { if (!o) { setDetailCert(null); setEditMode(false) } }}>
        <SheetContent className="w-[400px] sm:w-[500px] overflow-y-auto">
          {detailCert && (
            <>
              <SheetHeader>
                <SheetTitle>{staff.find(s => s.id === detailCert.staffId)?.name}</SheetTitle>
                <SheetDescription className="flex items-center gap-2">
                  {detailCert.type} <StatusBadge status={detailCert.status} />
                </SheetDescription>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                {editMode ? (
                  <>
                    <div className="flex flex-col gap-2">
                      <Label>Certificate Type</Label>
                      <Input defaultValue={detailCert.type} onChange={(e) => {
                        setDetailCert(prev => prev ? { ...prev, type: e.target.value } : null)
                      }} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex flex-col gap-2">
                        <Label>Issue Date</Label>
                        <Input type="date" defaultValue={detailCert.issueDate} onChange={(e) => {
                          setDetailCert(prev => prev ? { ...prev, issueDate: e.target.value } : null)
                        }} />
                      </div>
                      <div className="flex flex-col gap-2">
                        <Label>Expiry Date</Label>
                        <Input type="date" defaultValue={detailCert.expiryDate} onChange={(e) => {
                          setDetailCert(prev => prev ? { ...prev, expiryDate: e.target.value } : null)
                        }} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label>Status</Label>
                      <Select defaultValue={detailCert.status} onValueChange={(v) => {
                        setDetailCert(prev => prev ? { ...prev, status: v as Certificate["status"] } : null)
                      }}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Valid">Valid</SelectItem>
                          <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
                          <SelectItem value="Expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => {
                        setLocalCerts(prev => prev.map(c => c.id === detailCert.id ? detailCert : c))
                        toast.success("Certificate updated")
                        setEditMode(false)
                      }}>Save Changes</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditMode(false)}>Cancel</Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-y-3 text-sm">
                      <span className="text-muted-foreground">Certificate</span>
                      <span>{detailCert.type}</span>
                      <span className="text-muted-foreground">Issued</span>
                      <span>{format(parseISO(detailCert.issueDate), "MMM d, yyyy")}</span>
                      <span className="text-muted-foreground">Expires</span>
                      <span>{format(parseISO(detailCert.expiryDate), "MMM d, yyyy")}</span>
                      <span className="text-muted-foreground">Status</span>
                      <span><StatusBadge status={detailCert.status} /></span>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => setEditMode(true)}>
                        <Pencil className="mr-1 h-3 w-3" />Edit
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => { setUploadCert(detailCert); setUploadOpen(true) }}>
                        <Upload className="mr-1 h-3 w-3" />Upload
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => {
                        const isHidden = hiddenIds.includes(detailCert.id)
                        setHiddenIds(prev => isHidden ? prev.filter(id => id !== detailCert.id) : [...prev, detailCert.id])
                        toast.success(isHidden ? "Certificate is now visible" : "Certificate hidden from default view")
                      }}>
                        {hiddenIds.includes(detailCert.id) ? <Eye className="mr-1 h-3 w-3" /> : <EyeOff className="mr-1 h-3 w-3" />}
                        {hiddenIds.includes(detailCert.id) ? "Show" : "Hide"}
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Add New Certificate Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Certificate</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddCert} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Staff Member</Label>
              <Select name="staffId" required>
                <SelectTrigger><SelectValue placeholder="Select staff..." /></SelectTrigger>
                <SelectContent>
                  {staff.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.role})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Certificate Type</Label>
              <Select name="certType" required onValueChange={(v) => { if (v !== "Other") setCustomCertType("") }}>
                <SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger>
                <SelectContent>
                  {certTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  <SelectItem value="Other">Other...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {customCertType !== undefined && (
              <div className="flex flex-col gap-2" style={{ display: customCertType !== "" || document?.querySelector?.('[name="certType"]') ? undefined : "none" }}>
                <Label>Custom Certificate Type</Label>
                <Input value={customCertType} onChange={(e) => setCustomCertType(e.target.value)} placeholder="Enter certificate type..." />
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label>Issue Date</Label>
                <Input name="issueDate" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Expiry Date</Label>
                <Input name="expiryDate" type="date" required />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Notes</Label>
              <Textarea name="notes" rows={2} placeholder="Certification details..." />
            </div>
            <div className="flex h-20 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Upload className="h-4 w-4" />Upload certificate file (optional)
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setAddOpen(false)}>Cancel</Button>
              <Button type="submit">Add Certificate</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
