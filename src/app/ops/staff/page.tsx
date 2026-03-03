import { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, getStatusColor } from "@/lib/utils";
import { mockStaff } from "@/lib/mock-data";
import {
  Users,
  PlusCircle,
  Search,
  Award,
  AlertTriangle,
  Calendar,
  Clock,
  Shield,
} from "lucide-react";

export const metadata: Metadata = { title: "Staff" };

const roleLabels: Record<string, string> = {
  HEAD_GUIDE: "Head Guide",
  SENIOR_GUIDE: "Senior Guide",
  GUIDE: "Guide",
  TRAINEE: "Trainee",
  DISPATCH: "Dispatch",
  MANAGER: "Manager",
};

const roleColors: Record<string, string> = {
  HEAD_GUIDE: "bg-purple-100 text-purple-800 border-purple-200",
  SENIOR_GUIDE: "bg-blue-100 text-blue-800 border-blue-200",
  GUIDE: "bg-green-100 text-green-800 border-green-200",
  TRAINEE: "bg-yellow-100 text-yellow-800 border-yellow-200",
  DISPATCH: "bg-orange-100 text-orange-800 border-orange-200",
  MANAGER: "bg-slate-100 text-slate-800 border-slate-200",
};

export default function StaffPage() {
  return (
    <div className="flex flex-col">
      <Topbar title="Staff Management" subtitle="Guides, scheduling & certifications" />

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search staff..." className="w-64 pl-8" />
          </div>
          <Button className="gap-2">
            <PlusCircle className="h-4 w-4" />
            Add Staff Member
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "Active Staff", value: "12", icon: Users, color: "text-green-600" },
            { label: "On Duty Today", value: "6", icon: Clock, color: "text-blue-600" },
            { label: "Certs Expiring", value: "2", icon: AlertTriangle, color: "text-orange-600" },
            { label: "Total Certifications", value: "34", icon: Award, color: "text-purple-600" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="flex items-center gap-3 p-4">
                <s.icon className={cn("h-8 w-8", s.color)} />
                <div>
                  <p className="text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Staff Cards */}
        <div>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Today&apos;s Team
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {mockStaff.map((member) => (
              <Card key={member.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-skyline-100 text-lg font-bold text-skyline-700">
                      {member.firstName[0]}
                      {member.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-slate-800 truncate">
                          {member.firstName} {member.lastName}
                        </p>
                        <span
                          className={cn(
                            "flex-shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                            roleColors[member.role]
                          )}
                        >
                          {roleLabels[member.role]}
                        </span>
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {member.todayShift}
                      </p>

                      {/* Certifications */}
                      <div className="mt-3">
                        <p className="mb-1 flex items-center gap-1 text-xs font-medium text-muted-foreground">
                          <Shield className="h-3 w-3" />
                          Certifications
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {member.certifications.map((cert) => (
                            <span
                              key={cert}
                              className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600"
                            >
                              {cert}
                            </span>
                          ))}
                        </div>
                        {member.certsExpiring > 0 && (
                          <p className="mt-1.5 flex items-center gap-1 text-xs text-orange-600">
                            <AlertTriangle className="h-3 w-3" />
                            {member.certsExpiring} cert expiring soon
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 text-xs gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Schedule
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1 text-xs gap-1">
                      <Award className="h-3.5 w-3.5" />
                      Certs
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Certifications Alert */}
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-semibold text-orange-800">
              <AlertTriangle className="h-4 w-4" />
              Certification Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-white border border-orange-200 p-3">
                <div>
                  <p className="text-sm font-medium">Sarah Chen — CPR/AED</p>
                  <p className="text-xs text-muted-foreground">Expires April 15, 2026</p>
                </div>
                <Button size="sm" variant="warning" className="text-xs">
                  Schedule Renewal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
