import { cn } from "@/lib/utils"
import type { TimelineEvent } from "@/lib/types"
import { StatusBadge } from "@/components/status-badge"
import { format, parseISO } from "date-fns"

const typeColors: Record<string, string> = {
  purchase: "bg-chart-3",
  "in-service": "bg-primary",
  inspection: "bg-accent",
  maintenance: "bg-chart-4",
  "status-change": "bg-destructive",
}

interface TimelineProps {
  events: TimelineEvent[]
  className?: string
}

export function Timeline({ events, className }: TimelineProps) {
  return (
    <div className={cn("relative", className)}>
      <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />
      <div className="flex flex-col gap-6">
        {events.map((event) => (
          <div key={event.id} className="relative flex gap-4 pl-10">
            <div
              className={cn(
                "absolute left-2.5 top-1.5 h-3 w-3 rounded-full border-2 border-background",
                typeColors[event.type] || "bg-muted-foreground"
              )}
            />
            <div className="flex flex-1 flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{event.title}</span>
                {event.result && <StatusBadge status={event.result} />}
              </div>
              <p className="text-xs text-muted-foreground">{event.description}</p>
              <span className="text-xs text-muted-foreground/70">
                {format(parseISO(event.date), "MMM d, yyyy")}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
