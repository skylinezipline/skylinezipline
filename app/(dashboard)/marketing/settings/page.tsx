"use client"

import { BarChart3, Target, Share2, CreditCard, Settings, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "@/components/status-badge"
import { toast } from "sonner"

const integrations = [
  {
    name: "Google Analytics 4",
    type: "Analytics",
    status: "Connected" as const,
    description: "Track website sessions, events, and conversions",
    icon: BarChart3,
    lastSync: "2 hours ago",
    propertyId: "G-XXXXXXXXXX",
  },
  {
    name: "Google Ads",
    type: "Advertising",
    status: "Connected" as const,
    description: "Import campaign spend, clicks, and conversions",
    icon: Target,
    lastSync: "3 hours ago",
    propertyId: "AW-XXXXXXXXX",
  },
  {
    name: "Meta Ads",
    type: "Advertising",
    status: "Connected" as const,
    description: "Import Meta campaign data and ROAS metrics",
    icon: Share2,
    lastSync: "Yesterday",
    propertyId: "act_XXXXXXXX",
  },
  {
    name: "Stripe Attribution",
    type: "Payments",
    status: "Connected" as const,
    description: "Match bookings to marketing source for revenue attribution",
    icon: CreditCard,
    lastSync: "1 hour ago",
    propertyId: "sk_live_XXXX",
  },
]

export default function MarketingSettingsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Marketing Settings</h1>
        <p className="text-muted-foreground">Configure integrations and tracking standards</p>
      </div>

      {/* Integration Cards */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Integrations</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {integrations.map(int => (
            <Card key={int.name}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted">
                    <int.icon className="h-5 w-5 text-foreground" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold">{int.name}</h3>
                      <StatusBadge status={int.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">{int.description}</p>
                    <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>ID: <span className="font-mono">{int.propertyId}</span></span>
                      <span>Synced: {int.lastSync}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-3 h-7"
                      onClick={() => toast.info(`${int.name} configuration panel would open`)}
                    >
                      <Settings className="mr-1 h-3 w-3" />Configure
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* UTM Standards */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">UTM Naming Standards</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-sm text-muted-foreground">
            Consistent UTM parameters ensure accurate attribution across all marketing channels.
          </p>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left font-medium">Parameter</th>
                  <th className="p-3 text-left font-medium">Format</th>
                  <th className="p-3 text-left font-medium">Example</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="p-3"><Badge variant="outline" className="font-mono text-xs">utm_source</Badge></td>
                  <td className="p-3 text-muted-foreground">Platform name (lowercase)</td>
                  <td className="p-3 font-mono text-xs">google, meta, email</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3"><Badge variant="outline" className="font-mono text-xs">utm_medium</Badge></td>
                  <td className="p-3 text-muted-foreground">Channel type (lowercase)</td>
                  <td className="p-3 font-mono text-xs">cpc, social, email, organic</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3"><Badge variant="outline" className="font-mono text-xs">utm_campaign</Badge></td>
                  <td className="p-3 text-muted-foreground">campaign-name-YYYY-MM</td>
                  <td className="p-3 font-mono text-xs">summer-thrills-2026-01</td>
                </tr>
                <tr className="border-b">
                  <td className="p-3"><Badge variant="outline" className="font-mono text-xs">utm_content</Badge></td>
                  <td className="p-3 text-muted-foreground">Ad variant / creative ID</td>
                  <td className="p-3 font-mono text-xs">family-hero-v2</td>
                </tr>
                <tr>
                  <td className="p-3"><Badge variant="outline" className="font-mono text-xs">utm_term</Badge></td>
                  <td className="p-3 text-muted-foreground">Keyword (search only)</td>
                  <td className="p-3 font-mono text-xs">zipline-near-me</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-lg bg-muted p-3">
            <p className="text-xs font-medium text-muted-foreground">Example URL:</p>
            <code className="mt-1 block text-xs font-mono break-all text-foreground">
              https://skylineridge.com/book?utm_source=google&utm_medium=cpc&utm_campaign=summer-thrills-2026-01&utm_content=family-hero-v2
            </code>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
