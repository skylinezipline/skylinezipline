"use client"

import { useState, useMemo } from "react"
import { format } from "date-fns"
import { UserCheck, Shield, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { StatusBadge } from "@/components/status-badge"
import { useAppStore } from "@/lib/mock-store"
import { timeSlots } from "@/lib/mock-data"
import { toast } from "sonner"
import type { BookingGuest } from "@/lib/types"

export default function CheckinPage() {
  const { state, dispatch } = useAppStore()
  const stableNow = useMemo(() => new Date("2026-02-14T12:00:00"), [])
  const todayStr = format(stableNow, "yyyy-MM-dd")
  const currentTime = format(stableNow, "HH:mm")

  const todaySlots = useMemo(
    () => timeSlots
      .filter(s => s.date === todayStr && s.locationId === state.selectedLocationId && s.bookedCount > 0)
      .filter(s => s.time >= currentTime)
      .sort((a, b) => a.time.localeCompare(b.time))
      .slice(0, 9),
    [todayStr, state.selectedLocationId, currentTime]
  )

  const [selectedSlotTime, setSelectedSlotTime] = useState<string>(todaySlots[0]?.time || "")

  const selectedSlot = todaySlots.find(s => s.time === selectedSlotTime)
  const slotBookings = selectedSlot
    ? state.bookings.filter(b => b.slotId === selectedSlot.id && b.status !== "Cancelled")
    : []
  const allGuests = slotBookings.flatMap(b => b.guests)

  const handleCheckIn = (bookingId: string, guestId: string, guestName: string) => {
    dispatch({ type: "CHECK_IN_GUEST", bookingId, guestId })
    toast.success(`${guestName} checked in`)
  }

  const handleBulkCheckIn = () => {
    const eligibleGuests = slotBookings.flatMap(b =>
      b.guests
        .filter(g => !g.checkedIn && (g.waiverStatus === "Signed" || g.waiverStatus === "Covered"))
        .map(g => ({ bookingId: b.id, guestId: g.id }))
    )
    for (const { bookingId, guestId } of eligibleGuests) {
      dispatch({ type: "CHECK_IN_GUEST", bookingId, guestId })
    }
    toast.success(`${eligibleGuests.length} guests checked in`)
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Check-in</h1>
        <p className="text-muted-foreground">Check in guests for upcoming departures</p>
      </div>

      {todaySlots.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <UserCheck className="mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">No upcoming departures with bookings</p>
          </CardContent>
        </Card>
      ) : (
        <>
          <Tabs value={selectedSlotTime} onValueChange={setSelectedSlotTime}>
            <TabsList className="flex-wrap">
              {todaySlots.map(slot => (
                <TabsTrigger key={slot.time} value={slot.time} className="font-mono">
                  {slot.time}
                </TabsTrigger>
              ))}
            </TabsList>

            {todaySlots.map(slot => {
              const sBookings = state.bookings.filter(b => b.slotId === slot.id && b.status !== "Cancelled")
              const sGuests = sBookings.flatMap(b => b.guests)
              const checkedIn = sGuests.filter(g => g.checkedIn).length
              const total = sGuests.length

              return (
                <TabsContent key={slot.time} value={slot.time} className="mt-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base">
                          {slot.time} Departure - {checkedIn}/{total} checked in
                        </CardTitle>
                        <Button
                          size="sm"
                          onClick={handleBulkCheckIn}
                          disabled={sGuests.filter(g => !g.checkedIn && (g.waiverStatus === "Signed" || g.waiverStatus === "Covered")).length === 0}
                        >
                          <UserCheck className="mr-1 h-3 w-3" />Bulk Check-in
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="flex flex-col gap-2">
                      {sBookings.map(booking =>
                        booking.guests.map((guest: BookingGuest) => (
                          <div
                            key={guest.id}
                            className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                              guest.checkedIn ? "bg-primary/5 border-primary/20" : ""
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                                guest.checkedIn
                                  ? "bg-primary text-primary-foreground"
                                  : "bg-muted text-muted-foreground"
                              }`}>
                                {guest.checkedIn ? <UserCheck className="h-4 w-4" /> : guest.name.split(" ").map(n => n[0]).join("")}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{guest.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                  {guest.isMinor && (
                                    <span className="flex items-center gap-1">
                                      <Shield className="h-3 w-3" />Minor (age {guest.age})
                                    </span>
                                  )}
                                  {guest.guardianGuestId && (
                                    <span>
                                      Guardian: {booking.guests.find(g => g.id === guest.guardianGuestId)?.name}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={guest.waiverStatus} />
                              {guest.waiverStatus === "Outstanding" && (
                                <AlertCircle className="h-4 w-4 text-destructive" />
                              )}
                              {!guest.checkedIn ? (
                                <Button
                                  size="sm"
                                  variant={guest.waiverStatus === "Outstanding" ? "outline" : "default"}
                                  className="h-8"
                                  onClick={() => handleCheckIn(booking.id, guest.id, guest.name)}
                                >
                                  Check-in
                                </Button>
                              ) : (
                                <span className="text-xs font-medium text-primary">Checked In</span>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )
            })}
          </Tabs>
        </>
      )}
    </div>
  )
}
