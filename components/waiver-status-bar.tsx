import { cn } from "@/lib/utils"
import type { BookingGuest } from "@/lib/types"

interface WaiverStatusBarProps {
  guests: BookingGuest[]
  className?: string
  showLabels?: boolean
}

export function WaiverStatusBar({ guests, className, showLabels = false }: WaiverStatusBarProps) {
  const total = guests.length
  if (total === 0) return null

  const signed = guests.filter(g => g.waiverStatus === "Signed").length
  const covered = guests.filter(g => g.waiverStatus === "Covered").length
  const sent = guests.filter(g => g.waiverStatus === "Sent").length
  const outstanding = guests.filter(g => g.waiverStatus === "Outstanding").length

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <div className="flex h-2 w-full overflow-hidden rounded-full bg-muted">
        {signed > 0 && (
          <div
            className="bg-primary transition-all"
            style={{ width: `${(signed / total) * 100}%` }}
          />
        )}
        {covered > 0 && (
          <div
            className="bg-chart-3 transition-all"
            style={{ width: `${(covered / total) * 100}%` }}
          />
        )}
        {sent > 0 && (
          <div
            className="bg-accent transition-all"
            style={{ width: `${(sent / total) * 100}%` }}
          />
        )}
        {outstanding > 0 && (
          <div
            className="bg-destructive/40 transition-all"
            style={{ width: `${(outstanding / total) * 100}%` }}
          />
        )}
      </div>
      {showLabels && (
        <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
          {signed > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" />{signed} Signed</span>}
          {covered > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-chart-3" />{covered} Covered</span>}
          {sent > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-accent" />{sent} Sent</span>}
          {outstanding > 0 && <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-destructive/40" />{outstanding} Outstanding</span>}
        </div>
      )}
    </div>
  )
}
