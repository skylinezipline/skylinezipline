import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface KPIStatCardProps {
  label: string
  value: string | number
  trend?: "up" | "down" | "flat"
  trendValue?: string
  icon?: React.ReactNode
  className?: string
}

export function KPIStatCard({ label, value, trend, trendValue, icon, className }: KPIStatCardProps) {
  return (
    <Card className={cn("", className)}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{label}</span>
          {icon && <span className="text-muted-foreground">{icon}</span>}
        </div>
        <div className="mt-2 flex items-end gap-2">
          <span className="text-2xl font-bold tracking-tight">{value}</span>
          {trend && (
            <span
              className={cn(
                "mb-0.5 flex items-center gap-0.5 text-xs font-medium",
                trend === "up" && "text-primary",
                trend === "down" && "text-destructive",
                trend === "flat" && "text-muted-foreground"
              )}
            >
              {trend === "up" && <TrendingUp className="h-3 w-3" />}
              {trend === "down" && <TrendingDown className="h-3 w-3" />}
              {trend === "flat" && <Minus className="h-3 w-3" />}
              {trendValue}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
