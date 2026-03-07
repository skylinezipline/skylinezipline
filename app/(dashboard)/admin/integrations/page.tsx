"use client"

import { format, subDays, subHours, parseISO } from "date-fns"
import { CreditCard, BarChart3, Target, Share2, HardDrive, Cloud, Settings, RefreshCw } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import { DataTable } from "@/components/data-table"
import { integrations } from "@/lib/mock-data"
import { toast } from "sonner"

const iconMap: Record<string, React.ReactNode> = {
  CreditCard: <CreditCard className="h-5 w-5" />,
  BarChart3: <BarChart3 className="h-5 w-5" />,
  Target: <Target className="h-5 w-5" />,
  Share2: <Share2 className="h-5 w-5" />,
  HardDrive: <HardDrive className="h-5 w-5" />,
  Cloud: <Cloud className="h-5 w-5" />,
}

const now = new Date()
const webhookLog = [
  { id: "wh-1", event: "payment.completed", source: "Stripe", status: "Success", timestamp: format(subHours(now, 1), "yyyy-MM-dd HH:mm:ss"), payload: '{"amount": 240, "booking_id": "bk-1"}' },
  { id: "wh-2", event: "campaign.updated", source: "Google Ads", status: "Success", timestamp: format(subHours(now, 3), "yyyy-MM-dd HH:mm:ss"), payload: '{"campaign_id": "camp-1", "status": "active"}' },
  { id: "wh-3", event: "lead.created", source: "Meta Ads", status: "Success", timestamp: format(subHours(now, 5), "yyyy-MM-dd HH:mm:ss"), payload: '{"lead_id": "lead-20", "source": "meta"}' },
  { id: "wh-4", event: "payment.failed", source: "Stripe", status: "Error", timestamp: format(subHours(now, 8), "yyyy-MM-dd HH:mm:ss"), payload: '{"error": "card_declined"}' },
  { id: "wh-5", event: "session.sync", source: "GA4", status: "Success", timestamp: format(subHours(now, 12), "yyyy-MM-dd HH:mm:ss"), payload: '{"sessions": 1250, "date": "2026-02-11"}' },
  { id: "wh-6", event: "campaign.sync", source: "Google Ads", status: "Success", timestamp: format(subDays(now, 1), "yyyy-MM-dd HH:mm:ss"), payload: '{"campaigns_synced": 5}' },
  { id: "wh-7", event: "lead.updated", source: "Meta Ads", status: "Success", timestamp: format(subDays(now, 1), "yyyy-MM-dd HH:mm:ss"), payload: '{"lead_id": "lead-15", "status": "contacted"}' },
  { id: "wh-8", event: "payment.refund", source: "Stripe", status: "Success", timestamp: format(subDays(now, 2), "yyyy-MM-dd HH:mm:ss"), payload: '{"amount": 120, "booking_id": "bk-24"}' },
]

export default function IntegrationsPage() {
  const logColumns = [
    { key: "timestamp", label: "Time", render: (r: Record<string, unknown>) => <span className="font-mono text-xs">{String(r.timestamp)}</span> },
    { key: "event", label: "Event", render: (r: Record<string, unknown>) => <span className="font-mono text-xs">{String(r.event)}</span> },
    { key: "source", label: "Source" },
    { key: "status", label: "Status", render: (r: Record<string, unknown>) => <StatusBadge status={String(r.status)} /> },
    { key: "payload", label: "Payload", render: (r: Record<string, unknown>) => <code className="text-[10px] text-muted-foreground">{String(r.payload).slice(0, 50)}...</code> },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Integrations</h1>
        <p className="text-muted-foreground">Manage connected services and API integrations</p>
      </div>

      {/* Integration Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map(int => (
          <Card key={int.id}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                  {iconMap[int.icon] || <Settings className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{int.name}</h3>
                    <StatusBadge status={int.status} />
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">{int.type}</p>
                  {int.lastSync && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Last sync: {format(parseISO(int.lastSync), "MMM d, h:mm a")}
                    </p>
                  )}
                  <div className="mt-3 flex gap-2">
                    {int.status === "Connected" ? (
                      <>
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => toast.info(`${int.name} settings would open`)}>
                          <Settings className="mr-1 h-3 w-3" />Configure
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => toast.success(`${int.name} sync started`)}>
                          <RefreshCw className="mr-1 h-3 w-3" />Sync
                        </Button>
                      </>
                    ) : (
                      <Button size="sm" className="h-7 text-xs" onClick={() => toast.info(`${int.name} connection wizard would open`)}>
                        Connect
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Webhook Log */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Webhook / Event Log</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={webhookLog as unknown as Record<string, unknown>[]}
            columns={logColumns}
            pageSize={5}
          />
        </CardContent>
      </Card>
    </div>
  )
}
