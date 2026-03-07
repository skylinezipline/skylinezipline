"use client"

import { useState } from "react"
import { MapPin, Lock } from "lucide-react"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAppStore } from "@/lib/mock-store"
import { locations } from "@/lib/mock-data"

const MANAGER_CODE = "1234" // In production, would be verified server-side

export function LocationSwitcher() {
  const { state, dispatch } = useAppStore()
  const [pendingLocationId, setPendingLocationId] = useState<string | null>(null)
  const [code, setCode] = useState("")
  const [error, setError] = useState("")

  const handleLocationChange = (val: string) => {
    if (val === state.selectedLocationId) return
    setPendingLocationId(val)
    setCode("")
    setError("")
  }

  const handleConfirm = () => {
    if (code === MANAGER_CODE) {
      if (pendingLocationId) {
        dispatch({ type: "SET_LOCATION", locationId: pendingLocationId })
      }
      setPendingLocationId(null)
      setCode("")
      setError("")
    } else {
      setError("Invalid manager code. Please try again.")
    }
  }

  const pendingLocation = locations.find(l => l.id === pendingLocationId)

  return (
    <>
      <Select
        value={state.selectedLocationId}
        onValueChange={handleLocationChange}
      >
        <SelectTrigger className="w-48 h-9 gap-2">
          <MapPin className="h-4 w-4 text-primary shrink-0" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {locations.map((loc) => (
            <SelectItem key={loc.id} value={loc.id}>
              {loc.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Dialog open={!!pendingLocationId} onOpenChange={(open) => { if (!open) setPendingLocationId(null) }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5 text-primary" />
              Manager Authorization Required
            </DialogTitle>
            <DialogDescription>
              Enter your manager code to switch to <span className="font-semibold text-foreground">{pendingLocation?.name}</span>. This prevents unauthorized location changes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="manager-code">Manager Code</Label>
            <Input
              id="manager-code"
              type="password"
              placeholder="Enter 4-digit code"
              maxLength={4}
              value={code}
              onChange={(e) => { setCode(e.target.value); setError("") }}
              onKeyDown={(e) => { if (e.key === "Enter") handleConfirm() }}
              autoFocus
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPendingLocationId(null)}>Cancel</Button>
            <Button onClick={handleConfirm} disabled={code.length < 4}>Confirm Switch</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
