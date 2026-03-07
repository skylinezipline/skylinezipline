"use client"

import { useState, useMemo } from "react"
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts"
import { DollarSign, Users, Eye, TrendingUp, Target, MousePointerClick, UserPlus, Banknote, ExternalLink } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { KPIStatCard } from "@/components/kpi-stat-card"
import { ChartCard } from "@/components/chart-card"
import { DataTable } from "@/components/data-table"
import { StatusBadge } from "@/components/status-badge"
import { useAppStore } from "@/lib/mock-store"
import { campaigns, generateChartData, channelROAS, funnelData, locations } from "@/lib/mock-data"
import type { Campaign } from "@/lib/types"

export default function MarketingDashboardPage() {
  const { state } = useAppStore()
  const [range, setRange] = useState("30")
  const [channelFilter, setChannelFilter] = useState("all")

  const chartData = useMemo(() => generateChartData(Number(range)), [range])

  // Filter campaigns by selected location
  const locationCampaigns = useMemo(() => {
    // Assign campaigns to locations deterministically (odd index = loc-2)
    return campaigns.map((c, i) => ({ ...c, _locId: i % 2 === 0 ? "loc-1" : "loc-2" }))
      .filter(c => c._locId === state.selectedLocationId)
  }, [state.selectedLocationId])

  const filteredCampaigns = locationCampaigns.filter(
    c => channelFilter === "all" || c.channel === channelFilter
  )

  // Scale chart data by location (loc-2 is smaller)
  const locationChartData = useMemo(() => {
    const factor = state.selectedLocationId === "loc-1" ? 0.6 : 0.4
    return chartData.map(d => ({
      ...d,
      sessions: Math.round(d.sessions * factor),
      leads: Math.round(d.leads * factor),
      spend: Math.round(d.spend * factor),
      revenue: Math.round(d.revenue * factor),
    }))
  }, [chartData, state.selectedLocationId])

  const totalSessions = locationChartData.reduce((s, d) => s + d.sessions, 0)
  const totalLeads = locationChartData.reduce((s, d) => s + d.leads, 0)
  const totalRevenue = locationChartData.reduce((s, d) => s + d.revenue, 0)
  const totalSpend = locationChartData.reduce((s, d) => s + d.spend, 0)
  const totalBookings = filteredCampaigns.reduce((s, c) => s + c.bookings, 0)
  const overallROAS = totalSpend > 0 ? (totalRevenue / totalSpend).toFixed(2) : "0"
  const cac = totalBookings > 0 ? (totalSpend / totalBookings).toFixed(0) : "0"
  const conversionRate = totalLeads > 0 ? ((totalBookings / totalLeads) * 100).toFixed(1) : "0"

  const channelIcons: Record<string, string> = {
    "Google Ads": "https://www.google.com/favicon.ico",
    "GA4": "https://www.google.com/favicon.ico",
    "Meta Ads": "https://www.facebook.com/favicon.ico",
  }

  const columns = [
    {
      key: "name", label: "Campaign",
      render: (c: Campaign) => (
        <a
          href={c.platformUrl || "#"}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center gap-1.5 font-medium text-foreground hover:text-primary transition-colors"
          onClick={(e) => e.stopPropagation()}
        >
          {channelIcons[c.channel] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={channelIcons[c.channel]} alt="" className="h-4 w-4 rounded-sm" />
          )}
          {c.name}
          <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
        </a>
      ),
    },
    { key: "channel", label: "Channel", render: (c: Campaign) => <StatusBadge status={c.channel} /> },
    { key: "spend", label: "Spend", render: (c: Campaign) => `$${c.spend.toLocaleString()}` },
    { key: "revenue", label: "Revenue", render: (c: Campaign) => `$${c.revenue.toLocaleString()}` },
    { key: "roas", label: "ROAS", render: (c: Campaign) => c.roas > 0 ? `${c.roas.toFixed(1)}x` : "N/A" },
    { key: "cpl", label: "CPL", render: (c: Campaign) => c.cpl > 0 ? `$${c.cpl.toFixed(0)}` : "N/A" },
    { key: "status", label: "Status", render: (c: Campaign) => <StatusBadge status={c.status} /> },
  ]

  const locName = locations.find(l => l.id === state.selectedLocationId)?.name || ""

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Marketing Dashboard</h1>
          <p className="text-muted-foreground">Performance analytics for {locName}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={setRange}>
            <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Select value={channelFilter} onValueChange={setChannelFilter}>
            <SelectTrigger className="w-36 h-9"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Channels</SelectItem>
              <SelectItem value="GA4">GA4</SelectItem>
              <SelectItem value="Google Ads">Google Ads</SelectItem>
              <SelectItem value="Meta Ads">Meta Ads</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPIStatCard label="Sessions" value={totalSessions.toLocaleString()} trend="up" trendValue="+12%" icon={<Eye className="h-4 w-4" />} />
        <KPIStatCard label="Leads" value={totalLeads.toLocaleString()} trend="up" trendValue="+8%" icon={<UserPlus className="h-4 w-4" />} />
        <KPIStatCard label="Bookings" value={totalBookings.toLocaleString()} trend="up" trendValue="+15%" icon={<Target className="h-4 w-4" />} />
        <KPIStatCard label="Revenue" value={`$${totalRevenue.toLocaleString()}`} trend="up" trendValue="+18%" icon={<DollarSign className="h-4 w-4" />} />
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <KPIStatCard label="Ad Spend" value={`$${totalSpend.toLocaleString()}`} trend="flat" trendValue="+2%" icon={<Banknote className="h-4 w-4" />} />
        <KPIStatCard label="ROAS" value={`${overallROAS}x`} trend="up" trendValue="+0.3x" icon={<TrendingUp className="h-4 w-4" />} />
        <KPIStatCard label="CAC" value={`$${cac}`} trend="down" trendValue="-$4" icon={<MousePointerClick className="h-4 w-4" />} />
        <KPIStatCard label="Conversion Rate" value={`${conversionRate}%`} trend="up" trendValue="+1.2%" icon={<Users className="h-4 w-4" />} />
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        <ChartCard title={`Sessions & Leads - ${locName}`}>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={locationChartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
              <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
              <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="sessions" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name="Sessions" />
              <Line yAxisId="right" type="monotone" dataKey="leads" stroke="hsl(var(--chart-2))" strokeWidth={2} dot={false} name="Leads" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Spend vs Revenue">
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={locationChartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Legend />
              <Line type="monotone" dataKey="spend" stroke="hsl(var(--chart-5))" strokeWidth={2} dot={false} name="Spend" />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--chart-1))" strokeWidth={2} dot={false} name="Revenue" />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="ROAS by Channel">
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={channelROAS}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis dataKey="channel" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid hsl(var(--border))", background: "hsl(var(--card))" }} />
              <Bar dataKey="roas" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="ROAS" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Conversion Funnel">
          <div className="flex flex-col gap-3 py-2">
            {funnelData.map((step, i) => {
              const prevCount = i > 0 ? funnelData[i - 1].count : step.count
              const rate = i > 0 ? ((step.count / prevCount) * 100).toFixed(1) : "100"
              const widthPct = (step.count / funnelData[0].count) * 100
              return (
                <div key={step.stage} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{step.stage}</span>
                    <span className="text-muted-foreground">{step.count.toLocaleString()} ({rate}%)</span>
                  </div>
                  <div className="h-8 w-full rounded-md bg-muted">
                    <div
                      className="flex h-full items-center rounded-md bg-primary/20 px-3 text-xs font-medium text-primary transition-all"
                      style={{ width: `${widthPct}%` }}
                    >
                      {step.count.toLocaleString()}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </ChartCard>
      </div>

      {/* Top Campaigns Table */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Campaigns - {locName}</h2>
        <DataTable
          data={filteredCampaigns as unknown as Record<string, unknown>[]}
          columns={columns as { key: string; label: string; render?: (item: Record<string, unknown>) => React.ReactNode }[]}
          searchField={"name" as keyof Record<string, unknown>}
          searchPlaceholder="Search campaigns..."
        />
      </div>
    </div>
  )
}
