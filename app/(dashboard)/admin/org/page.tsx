"use client"

import { useState } from "react"
import { Plus, UserPlus, Pencil, Trash2, BarChart3, UserX, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { DataTable } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { KPIStatCard } from "@/components/kpi-stat-card"
import { locations, staff, certificates } from "@/lib/mock-data"
import { useAppStore } from "@/lib/mock-store"
import type { Staff } from "@/lib/types"
import { toast } from "sonner"

const roles: Staff["role"][] = ["Owner", "Manager", "Lead Guide", "Guide", "Ground Staff", "Maintenance Tech"]

export default function OrgPage() {
  const { state } = useAppStore()
  const [editLocOpen, setEditLocOpen] = useState(false)
  const [editLocId, setEditLocId] = useState<string | null>(null)
  const [addLocOpen, setAddLocOpen] = useState(false)
  const [editStaffOpen, setEditStaffOpen] = useState(false)
  const [editStaffData, setEditStaffData] = useState<Staff | null>(null)
  const [staffDetail, setStaffDetail] = useState<Staff | null>(null)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [retiredStaffIds, setRetiredStaffIds] = useState<string[]>([])
  const [locationFilter, setLocationFilter] = useState<string>("all")
  const [localLocations, setLocalLocations] = useState(locations)
  const [showRetired, setShowRetired] = useState(false)

  const editLoc = localLocations.find(l => l.id === editLocId)

  // Simulated staff stats
  function getStaffStats(s: Staff) {
    const hash = s.id.charCodeAt(s.id.length - 1)
    const inspections = state.inspections.filter(i => i.inspectorId === s.id).length
    const maintenanceCompleted = state.maintenance.filter(m => m.assignedToId === s.id && (m.status === "Completed" || m.status === "Verified")).length
    const toursGuided = Math.floor(hash * 3.7) + 12
    const certs = certificates.filter(c => c.staffId === s.id)
    return {
      inspections,
      maintenanceCompleted,
      toursGuided,
      certs,
      hoursLast7: Math.floor(hash * 1.2) + 28,
      hoursLast30: Math.floor(hash * 4.5) + 120,
      hoursLast60: Math.floor(hash * 9) + 240,
      hoursLast90: Math.floor(hash * 13) + 360,
    }
  }

  const filteredStaff = staff
    .filter(s => showRetired || !retiredStaffIds.includes(s.id))
    .filter(s => locationFilter === "all" || s.locationId === locationFilter)

  const userColumns = [
    { key: "name", label: "Name", render: (s: Staff) => <span className="font-medium">{s.name}</span> },
    { key: "email", label: "Email", render: (s: Staff) => <span className="text-muted-foreground">{s.email}</span> },
    { key: "phone", label: "Phone" },
    { key: "role", label: "Role", render: (s: Staff) => (
      <div className="flex items-center gap-1">
        <StatusBadge status={s.role} />
        {retiredStaffIds.includes(s.id) && <StatusBadge status="Retired" />}
      </div>
    )},
    { key: "locationId", label: "Location", render: (s: Staff) => localLocations.find(l => l.id === s.locationId)?.name || "-" },
    { key: "actions", label: "", render: (s: Staff) => (
      <div className="flex gap-1">
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setEditStaffData(s); setEditStaffOpen(true) }}>
          <Pencil className="h-3 w-3" />
        </Button>
        <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setStaffDetail(s) }}>
          <BarChart3 className="h-3 w-3" />
        </Button>
        {!retiredStaffIds.includes(s.id) && (
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={(e) => {
            e.stopPropagation()
            if (confirm(`Retire ${s.name}? They will be retained in the system for 5 years but cannot be assigned to timeslots.`)) {
              setRetiredStaffIds(prev => [...prev, s.id])
              toast.success(`${s.name} has been retired. Records retained for 5 years.`)
            }
          }}>
            <UserX className="h-3 w-3" />
          </Button>
        )}
      </div>
    )},
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organization</h1>
        <p className="text-muted-foreground">Manage your organization, locations, and team</p>
      </div>

      <Tabs defaultValue="organization">
        <TabsList>
          <TabsTrigger value="organization">Organization</TabsTrigger>
          <TabsTrigger value="locations">Locations</TabsTrigger>
          <TabsTrigger value="users">Users & Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="organization" className="mt-4 flex flex-col gap-6">
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Mission Statement</CardTitle></CardHeader>
            <CardContent>
              <Textarea defaultValue="To provide safe, thrilling, and unforgettable zipline experiences that connect people with nature and inspire a sense of adventure." rows={3} className="text-sm" />
              <Button size="sm" className="mt-3" onClick={() => toast.success("Mission statement saved")}>Save</Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Goals</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {["Achieve 100% ACCT compliance across all locations", "Grow bookings 25% year-over-year", "Maintain zero safety incidents", "Launch Canyon Creek night tours by Q3 2026"].map((goal, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-md border p-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                    <Input defaultValue={goal} className="border-0 bg-transparent p-0 text-sm shadow-none focus-visible:ring-0" />
                  </div>
                ))}
                <Button variant="outline" size="sm" className="self-start" onClick={() => toast.info("Add goal form would appear")}>
                  <Plus className="mr-1 h-3 w-3" />Add Goal
                </Button>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Standards & Compliance</CardTitle></CardHeader>
            <CardContent>
              <Textarea defaultValue="All operations adhere to ACCT (Association for Challenge Course Technology) standards. Equipment inspections follow manufacturer guidelines and ANSI/ACCT standards. All guides maintain current certifications and complete annual refresher training. Emergency response procedures are reviewed quarterly." rows={5} className="text-sm" />
              <Button size="sm" className="mt-3" onClick={() => toast.success("Standards saved")}>Save</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="locations" className="mt-4">
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setAddLocOpen(true)}>
              <Plus className="mr-1 h-4 w-4" />Add Location
            </Button>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {localLocations.map(loc => (
              <Card key={loc.id}>
                <CardHeader className="pb-3"><CardTitle className="text-base">{loc.name}</CardTitle></CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Address</Label>
                        <p className="mt-0.5">{loc.address}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Capacity per Departure</Label>
                        <p className="mt-0.5 font-semibold">{loc.capacity} guests</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Operating Hours</Label>
                        <p className="mt-0.5 font-mono">{loc.operatingHoursStart} - {loc.operatingHoursEnd}</p>
                      </div>
                      <div>
                        <Label className="text-xs text-muted-foreground">Slot Interval</Label>
                        <p className="mt-0.5">{loc.slotInterval} minutes</p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Staff Count</Label>
                      <p className="mt-0.5 font-semibold">{staff.filter(s => s.locationId === loc.id).length} members</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => { setEditLocId(loc.id); setEditLocOpen(true) }}>
                      Edit Location
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="users" className="mt-4 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Select value={locationFilter} onValueChange={setLocationFilter}>
              <SelectTrigger className="w-44 h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                {localLocations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Button variant={showRetired ? "default" : "outline"} size="sm" onClick={() => setShowRetired(!showRetired)}>
              {showRetired ? "Showing Retired" : "Show Retired"}
            </Button>
          </div>
          <DataTable
            data={filteredStaff as unknown as Record<string, unknown>[]}
            columns={userColumns as { key: string; label: string; render?: (item: Record<string, unknown>) => React.ReactNode }[]}
            searchField={"name" as keyof Record<string, unknown>}
            searchPlaceholder="Search staff..."
            onRowClick={(item) => setStaffDetail(item as unknown as Staff)}
            actions={
              <Button size="sm" onClick={() => setInviteOpen(true)}>
                <UserPlus className="mr-1 h-3 w-3" />Invite User
              </Button>
            }
          />
        </TabsContent>
      </Tabs>

      {/* Edit Location Dialog */}
      <Dialog open={editLocOpen} onOpenChange={setEditLocOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Edit Location: {editLoc?.name}</DialogTitle>
          </DialogHeader>
          {editLoc && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Name</Label>
                <Input defaultValue={editLoc.name} />
              </div>
              <div className="flex flex-col gap-2">
                <Label>Address</Label>
                <Input defaultValue={editLoc.address} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Capacity</Label>
                  <Input type="number" defaultValue={editLoc.capacity} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Slot Interval (min)</Label>
                  <Input type="number" defaultValue={editLoc.slotInterval} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Open</Label>
                  <Input type="time" defaultValue={editLoc.operatingHoursStart} />
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Close</Label>
                  <Input type="time" defaultValue={editLoc.operatingHoursEnd} />
                </div>
              </div>
              <DialogFooter className="flex justify-between">
                <Button variant="destructive" size="sm" onClick={() => { setEditLocOpen(false); toast.success(`${editLoc.name} deleted`) }}>
                  <Trash2 className="mr-1 h-3 w-3" />Delete Location
                </Button>
                <Button onClick={() => { setEditLocOpen(false); toast.success("Location updated") }}>Save Changes</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Location Dialog */}
      <Dialog open={addLocOpen} onOpenChange={setAddLocOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Location</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2"><Label>Name</Label><Input placeholder="e.g., Sunset Ridge" /></div>
            <div className="flex flex-col gap-2"><Label>Address</Label><Input placeholder="123 Mountain Way..." /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label>Capacity</Label><Input type="number" defaultValue={10} /></div>
              <div className="flex flex-col gap-2"><Label>Slot Interval (min)</Label><Input type="number" defaultValue={20} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2"><Label>Open</Label><Input type="time" defaultValue="09:00" /></div>
              <div className="flex flex-col gap-2"><Label>Close</Label><Input type="time" defaultValue="17:00" /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddLocOpen(false)}>Cancel</Button>
              <Button onClick={() => {
                const newLoc = {
                  id: `loc-${Date.now()}`,
                  name: "New Location",
                  address: "",
                  capacity: 10,
                  slotInterval: 20,
                  operatingHoursStart: "09:00",
                  operatingHoursEnd: "17:00",
                }
                setLocalLocations(prev => [...prev, newLoc])
                setAddLocOpen(false)
                toast.success("Location added")
              }}>Add Location</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={editStaffOpen} onOpenChange={setEditStaffOpen}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Edit Staff Member</DialogTitle>
          </DialogHeader>
          {editStaffData && (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2"><Label>Name</Label><Input defaultValue={editStaffData.name} /></div>
              <div className="flex flex-col gap-2"><Label>Email</Label><Input type="email" defaultValue={editStaffData.email} /></div>
              <div className="flex flex-col gap-2"><Label>Phone</Label><Input defaultValue={editStaffData.phone} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <Label>Role</Label>
                  <Select defaultValue={editStaffData.role}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col gap-2">
                  <Label>Location</Label>
                  <Select defaultValue={editStaffData.locationId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditStaffOpen(false)}>Cancel</Button>
                <Button onClick={() => { setEditStaffOpen(false); toast.success(`${editStaffData.name} updated`) }}>Save Changes</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Invite User Dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Invite User</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2"><Label>Email</Label><Input type="email" placeholder="team@example.com" /></div>
            <div className="flex flex-col gap-2">
              <Label>Role</Label>
              <Select defaultValue="Guide">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roles.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Location</Label>
              <Select defaultValue="loc-1">
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {locations.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button onClick={() => { setInviteOpen(false); toast.success("Invitation sent") }}>Send Invite</Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff Productivity Dashboard Sheet */}
      <Sheet open={!!staffDetail} onOpenChange={(o) => { if (!o) setStaffDetail(null) }}>
        <SheetContent className="w-[400px] sm:w-[520px] overflow-y-auto">
          {staffDetail && (() => {
            const stats = getStaffStats(staffDetail)
            return (
              <>
                <SheetHeader>
                  <SheetTitle>{staffDetail.name}</SheetTitle>
                  <SheetDescription className="flex items-center gap-2">
                    <StatusBadge status={staffDetail.role} />
                    <span className="text-xs">{locations.find(l => l.id === staffDetail.locationId)?.name}</span>
                  </SheetDescription>
                </SheetHeader>
                <div className="mt-6 flex flex-col gap-6">
                  {/* Contact */}
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    <span className="text-muted-foreground">Email</span>
                    <span>{staffDetail.email}</span>
                    <span className="text-muted-foreground">Phone</span>
                    <span>{staffDetail.phone}</span>
                  </div>

                  {/* Hours */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Hours Worked</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <KPIStatCard label="Last 7 Days" value={`${stats.hoursLast7}h`} trend="flat" trendValue="" icon={null} />
                      <KPIStatCard label="Last 30 Days" value={`${stats.hoursLast30}h`} trend="flat" trendValue="" icon={null} />
                      <KPIStatCard label="Last 60 Days" value={`${stats.hoursLast60}h`} trend="flat" trendValue="" icon={null} />
                      <KPIStatCard label="Last 90 Days" value={`${stats.hoursLast90}h`} trend="flat" trendValue="" icon={null} />
                    </div>
                  </div>

                  {/* Activity */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Activity Summary</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <Card>
                        <CardContent className="p-3 text-center">
                          <p className="text-xl font-bold text-primary">{stats.toursGuided}</p>
                          <p className="text-[11px] text-muted-foreground">Tours Guided</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3 text-center">
                          <p className="text-xl font-bold text-primary">{stats.inspections}</p>
                          <p className="text-[11px] text-muted-foreground">Inspections</p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-3 text-center">
                          <p className="text-xl font-bold text-primary">{stats.maintenanceCompleted}</p>
                          <p className="text-[11px] text-muted-foreground">Maintenance</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Certifications */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Certifications</h4>
                    {stats.certs.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No certifications on file</p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {stats.certs.map(c => (
                          <div key={c.id} className="flex items-center justify-between rounded-md border p-2">
                            <span className="text-sm">{c.type}</span>
                            <StatusBadge status={c.status} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button variant="outline" size="sm" onClick={() => { setStaffDetail(null); setEditStaffData(staffDetail); setEditStaffOpen(true) }}>
                    <Pencil className="mr-1 h-3 w-3" />Edit Info
                  </Button>
                </div>
              </>
            )
          })()}
        </SheetContent>
      </Sheet>
    </div>
  )
}
