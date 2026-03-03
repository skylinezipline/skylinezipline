"use client";

import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";
import {
  mockRevenueData,
  mockTourMix,
  mockWeeklyOccupancy,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { Download, TrendingUp, Users, DollarSign, Star } from "lucide-react";

export default function ReportsPage() {
  return (
    <div className="flex flex-col">
      <Topbar title="Reports & Analytics" subtitle="Business performance insights" />

      <div className="space-y-6 p-6">
        {/* Export row */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing data for <strong>March 2026</strong> (month-to-date)
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-2">
              <Download className="h-4 w-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "MTD Revenue",
              value: "$38,200",
              sub: "+12% vs last Mar",
              icon: DollarSign,
              color: "text-green-600",
              bg: "bg-green-50",
            },
            {
              label: "Total Guests",
              value: "313",
              sub: "58 bookings",
              icon: Users,
              color: "text-blue-600",
              bg: "bg-blue-50",
            },
            {
              label: "Avg Per Guest",
              value: "$122",
              sub: "revenue per head",
              icon: TrendingUp,
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
            {
              label: "Avg Rating",
              value: "4.8 ★",
              sub: "from 41 reviews",
              icon: Star,
              color: "text-yellow-600",
              bg: "bg-yellow-50",
            },
          ].map((kpi) => (
            <Card key={kpi.label}>
              <CardContent className="flex items-center gap-3 p-5">
                <div className={`rounded-xl p-3 ${kpi.bg}`}>
                  <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold">{kpi.value}</p>
                  <p className="text-xs text-muted-foreground">{kpi.sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Monthly Revenue</CardTitle>
            <CardDescription>Sept 2025 → March 2026</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockRevenueData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <YAxis
                  tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 12, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value: number, name: string) => {
                    if (name === "revenue") return [formatCurrency(value), "Revenue"];
                    if (name === "guests") return [value, "Guests"];
                    return [value, name];
                  }}
                  contentStyle={{ borderRadius: "8px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#0ea5e9" radius={[4, 4, 0, 0]} name="revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Two column: Tour Mix + Occupancy */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Tour type mix */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Tour Mix (MTD)</CardTitle>
              <CardDescription>Revenue by tour type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width={180} height={180}>
                  <PieChart>
                    <Pie
                      data={mockTourMix}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {mockTourMix.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => [`${v}%`, "Share"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {mockTourMix.map((item) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div
                          className="h-2.5 w-2.5 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-slate-700">{item.name}</span>
                      </div>
                      <span className="font-semibold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Weekly occupancy */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-semibold">Weekly Occupancy Rate</CardTitle>
              <CardDescription>% of capacity booked per day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={mockWeeklyOccupancy} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="day" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                  <YAxis
                    tickFormatter={(v) => `${v}%`}
                    tick={{ fontSize: 12, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    domain={[0, 100]}
                  />
                  <Tooltip formatter={(v) => [`${v}%`, "Occupancy"]} />
                  <Line
                    type="monotone"
                    dataKey="occupancy"
                    stroke="#22c55e"
                    strokeWidth={2.5}
                    dot={{ fill: "#22c55e", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Booking Source Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Booking Source Breakdown</CardTitle>
            <CardDescription>Where are guests coming from?</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-4">
              {[
                { source: "Website", value: 54, pct: "54%", color: "bg-skyline-500" },
                { source: "Phone", value: 22, pct: "22%", color: "bg-forest-500" },
                { source: "Partners / OTAs", value: 14, pct: "14%", color: "bg-purple-500" },
                { source: "Walk-in", value: 10, pct: "10%", color: "bg-orange-500" },
              ].map((s) => (
                <div key={s.source} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{s.source}</span>
                    <span className="font-bold">{s.pct}</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100">
                    <div
                      className={`h-2 rounded-full ${s.color}`}
                      style={{ width: s.pct }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{s.value} bookings</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
