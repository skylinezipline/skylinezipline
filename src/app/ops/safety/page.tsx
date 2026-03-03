import { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn, getStatusColor } from "@/lib/utils";
import { mockIncidents } from "@/lib/mock-data";
import {
  ShieldAlert,
  PlusCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  TrendingDown,
  Award,
} from "lucide-react";

export const metadata: Metadata = { title: "Safety" };

const severityColors: Record<string, string> = {
  LOW: "bg-green-100 text-green-800 border-green-200",
  MEDIUM: "bg-yellow-100 text-yellow-800 border-yellow-200",
  HIGH: "bg-orange-100 text-orange-800 border-orange-200",
  CRITICAL: "bg-red-100 text-red-800 border-red-200",
};

const typeLabels: Record<string, string> = {
  NEAR_MISS: "Near Miss",
  GUEST_INJURY: "Guest Injury",
  STAFF_INJURY: "Staff Injury",
  EQUIPMENT_FAILURE: "Equipment Failure",
  WEATHER_EVENT: "Weather Event",
  PROPERTY_DAMAGE: "Property Damage",
  OTHER: "Other",
};

export default function SafetyPage() {
  const openIncidents = mockIncidents.filter((i) => i.status !== "CLOSED");
  const daysSinceIncident = 3;

  return (
    <div className="flex flex-col">
      <Topbar
        title="Safety & Compliance"
        subtitle="Incident reports, near-misses & safety culture"
      />

      <div className="space-y-6 p-6">
        {/* Safety Score Banner */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100 sm:col-span-1">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-200">
                <Award className="h-8 w-8 text-green-700" />
              </div>
              <p className="mt-3 text-4xl font-bold text-green-800">
                {daysSinceIncident}
              </p>
              <p className="text-sm text-green-700">
                Days since last recordable incident
              </p>
              <p className="mt-1 text-xs text-green-600">Safety season record: 47 days</p>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4 sm:col-span-2">
            {[
              { label: "Open Incidents", value: openIncidents.length, icon: AlertTriangle, color: "text-orange-600" },
              { label: "YTD Incidents", value: "8", icon: FileText, color: "text-blue-600" },
              { label: "Near Misses (YTD)", value: "3", icon: TrendingDown, color: "text-purple-600" },
              { label: "Safety Trainings", value: "12", icon: CheckCircle, color: "text-green-600" },
            ].map((s) => (
              <Card key={s.label}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-2">
                    <s.icon className={cn("h-5 w-5 mt-0.5", s.color)} />
                    <div>
                      <p className="text-2xl font-bold">{s.value}</p>
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-3">
          <Button className="gap-2" variant="destructive">
            <PlusCircle className="h-4 w-4" />
            Report Incident
          </Button>
          <Button variant="outline" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Log Near Miss
          </Button>
          <Button variant="outline" className="gap-2">
            <FileText className="h-4 w-4" />
            Daily Safety Checklist
          </Button>
          <Button variant="outline" className="gap-2">
            <ShieldAlert className="h-4 w-4" />
            Weather Hold
          </Button>
        </div>

        {/* Open Incidents */}
        {openIncidents.length > 0 && (
          <div>
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Open Incidents — Require Action
            </h2>
            <div className="space-y-3">
              {openIncidents.map((incident) => (
                <Card key={incident.id} className="border-orange-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-muted-foreground">
                            {incident.incidentNumber}
                          </span>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                              severityColors[incident.severity]
                            )}
                          >
                            {incident.severity}
                          </span>
                          <span className="rounded bg-slate-100 px-2 py-0.5 text-xs">
                            {typeLabels[incident.type] ?? incident.type}
                          </span>
                        </div>
                        <p className="mt-1.5 text-sm font-medium text-slate-800">
                          {incident.description}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-muted-foreground">
                          <span>{incident.date}</span>
                          <span>·</span>
                          <span>{incident.location}</span>
                          <span>·</span>
                          <span>Reported by {incident.reportedBy}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            getStatusColor(incident.status)
                          )}
                        >
                          {incident.status.replace(/_/g, " ")}
                        </span>
                        <Button size="sm" variant="outline" className="text-xs">
                          Review
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* All Incidents Table */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Incident Log</CardTitle>
            <CardDescription>All incidents — most recent first</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    {["#", "Date", "Type", "Severity", "Location", "Description", "Reported By", "Status"].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {mockIncidents.map((incident) => (
                    <tr key={incident.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {incident.incidentNumber}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {incident.date}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {typeLabels[incident.type] ?? incident.type}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            severityColors[incident.severity]
                          )}
                        >
                          {incident.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {incident.location}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-700 max-w-xs truncate">
                        {incident.description}
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {incident.reportedBy}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                            getStatusColor(incident.status)
                          )}
                        >
                          {incident.status.replace(/_/g, " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Compliance Checklist */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Pre-Operation Checklist — Today</CardTitle>
            <CardDescription>Complete before first tour departure</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2">
              {[
                { label: "All equipment inspected & logged", done: true },
                { label: "Weather conditions evaluated", done: true },
                { label: "Staff certifications verified", done: true },
                { label: "Communication radios tested", done: true },
                { label: "Rescue kit stocked & accessible", done: false },
                { label: "First aid kit inspected", done: false },
                { label: "Emergency contact list posted", done: true },
                { label: "Lines and anchors visually inspected", done: false },
              ].map((item) => (
                <div
                  key={item.label}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border p-3 text-sm",
                    item.done ? "border-green-200 bg-green-50" : "border-slate-200 bg-white"
                  )}
                >
                  {item.done ? (
                    <CheckCircle className="h-4 w-4 flex-shrink-0 text-green-600" />
                  ) : (
                    <Clock className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                  )}
                  <span className={item.done ? "text-slate-600 line-through" : "text-slate-700"}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
