import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

const statusStyles: Record<string, string> = {
  // Generic
  Active: "bg-primary/15 text-primary border-primary/20",
  Paused: "bg-muted text-muted-foreground border-muted",
  Ended: "bg-muted text-muted-foreground border-muted",
  Draft: "bg-muted text-muted-foreground border-muted",
  Published: "bg-primary/15 text-primary border-primary/20",
  // Booking
  Confirmed: "bg-primary/15 text-primary border-primary/20",
  Pending: "bg-accent/15 text-accent border-accent/20",
  Cancelled: "bg-destructive/15 text-destructive border-destructive/20",
  Completed: "bg-primary/15 text-primary border-primary/20",
  "No-show": "bg-destructive/15 text-destructive border-destructive/20",
  // Payment
  Paid: "bg-primary/15 text-primary border-primary/20",
  Refunded: "bg-muted text-muted-foreground border-muted",
  Partial: "bg-accent/15 text-accent border-accent/20",
  // Slot
  Open: "bg-primary/15 text-primary border-primary/20",
  Filling: "bg-accent/15 text-accent border-accent/20",
  Full: "bg-destructive/15 text-destructive border-destructive/20",
  Closed: "bg-muted text-muted-foreground border-muted",
  // Lead
  New: "bg-chart-3/15 text-chart-3 border-chart-3/20",
  Contacted: "bg-accent/15 text-accent border-accent/20",
  Qualified: "bg-primary/15 text-primary border-primary/20",
  Won: "bg-primary/15 text-primary border-primary/20",
  Lost: "bg-destructive/15 text-destructive border-destructive/20",
  // Waiver
  Signed: "bg-primary/15 text-primary border-primary/20",
  Covered: "bg-chart-3/15 text-chart-3 border-chart-3/20",
  Outstanding: "bg-destructive/15 text-destructive border-destructive/20",
  Sent: "bg-accent/15 text-accent border-accent/20",
  // Equipment
  Good: "bg-primary/15 text-primary border-primary/20",
  Watch: "bg-accent/15 text-accent border-accent/20",
  Replace: "bg-destructive/15 text-destructive border-destructive/20",
  Quarantined: "bg-accent/15 text-accent border-accent/20",
  Retired: "bg-muted text-muted-foreground border-muted",
  // Inspection
  Pass: "bg-primary/15 text-primary border-primary/20",
  "Needs Adjustment": "bg-accent/15 text-accent border-accent/20",
  Fail: "bg-destructive/15 text-destructive border-destructive/20",
  // Maintenance
  "In Progress": "bg-chart-3/15 text-chart-3 border-chart-3/20",
  "Waiting Parts": "bg-accent/15 text-accent border-accent/20",
  Verified: "bg-primary/15 text-primary border-primary/20",
  // Certificate
  Valid: "bg-primary/15 text-primary border-primary/20",
  "Expiring Soon": "bg-accent/15 text-accent border-accent/20",
  Expired: "bg-destructive/15 text-destructive border-destructive/20",
  // Integration
  Connected: "bg-primary/15 text-primary border-primary/20",
  Disconnected: "bg-muted text-muted-foreground border-muted",
  Error: "bg-destructive/15 text-destructive border-destructive/20",
  // Invoice (Sent is shared with Waiver → uses accent color above)
  Overdue: "bg-destructive/15 text-destructive border-destructive/20",
  Void: "bg-muted text-muted-foreground border-muted",
  // Social / UGC
  Approved: "bg-primary/15 text-primary border-primary/20",
  Rejected: "bg-destructive/15 text-destructive border-destructive/20",
  Scheduled: "bg-chart-3/15 text-chart-3 border-chart-3/20",
  // Priority
  Low: "bg-muted text-muted-foreground border-muted",
  Medium: "bg-accent/15 text-accent border-accent/20",
  High: "bg-destructive/15 text-destructive border-destructive/20",
  Critical: "bg-destructive/20 text-destructive border-destructive/30",
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs font-medium",
        statusStyles[status] || "bg-muted text-muted-foreground border-muted",
        className
      )}
    >
      {status}
    </Badge>
  )
}
