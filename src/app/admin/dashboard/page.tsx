import { Metadata } from "next";
import {
  ClipboardCheck,
  Bell,
  Wrench,
  Award,
  ChevronRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Back-end Dashboard",
};

// ── Mock data ──────────────────────────────────────────────────────────────────

const overdueInspections = [
  { id: "HRN-2024-001", name: "Full Body Harness A", category: "Harnesses", daysAgo: 26 },
  { id: "HRN-2024-002", name: "Full Body Harness B", category: "Harnesses", daysAgo: 26 },
  { id: "HRN-2024-003", name: "Full Body Harness C", category: "Harnesses", daysAgo: 33 },
  { id: "TRL-2024-001", name: "Speed Trolley A",    category: "Trolleys",  daysAgo: 23 },
  { id: "TRL-2024-002", name: "Speed Trolley B",    category: "Trolleys",  daysAgo: 23 },
];

const maintenanceTasks = [
  { id: "TRL-2024-003", title: "Replace wheel bearing",       desc: "Wheel bearing failure detected during pre-use inspection. Re...", priority: "Critical", status: "Open" },
  { id: "HRN-2024-003", title: "Monitor leg loop abrasion",   desc: "Minor abrasion on leg loop webbing. Monitor and replace if p...", priority: "Medium",   status: "In Progress" },
  { id: "LNY-2024-002", title: "Assess lanyard fraying",      desc: "Slight fraying on one arm. Assess if replacement needed...",        priority: "High",     status: "Waiting Parts" },
  { id: "HLM-2023-008", title: "UV damage assessment",        desc: "Shell discoloration from UV damage. Full assessment needed...",      priority: "Medium",   status: "In Progress" },
  { id: "HLM-2024-001", title: "Headband replacement",        desc: "Replace worn headband padding...",                                   priority: "Low",      status: "Open" },
];

const certAlerts = [
  { name: "Dylan Nash",  cert: "ACCT Level 2 Practitioner",  exp: "Mar 1, 2026",  status: "Expiring Soon" },
  { name: "Jake Torres", cert: "Wilderness First Responder", exp: "Jan 1, 2026",  status: "Expired" },
];

const equipmentOverview = {
  statuses: [
    { label: "Active equipment",      count: 15, badge: "Active",      badgeClass: "bg-emerald-100 text-emerald-700" },
    { label: "Quarantined equipment", count: 0,  badge: "Quarantined", badgeClass: "bg-orange-100 text-orange-700" },
    { label: "Retired equipment",     count: 1,  badge: "Retired",     badgeClass: "bg-neutral-100 text-neutral-600" },
  ],
  conditions: [
    { label: "Condition: Good",    count: 13, badge: "Good",    badgeClass: "bg-emerald-100 text-emerald-700" },
    { label: "Condition: Watch",   count: 2,  badge: "Watch",   badgeClass: "bg-yellow-100 text-yellow-700" },
    { label: "Condition: Replace", count: 1,  badge: "Replace", badgeClass: "bg-red-100 text-red-700" },
  ],
};

// ── Badge helpers ──────────────────────────────────────────────────────────────

function priorityClass(p: string) {
  if (p === "Critical") return "bg-red-100 text-red-700";
  if (p === "High")     return "bg-orange-100 text-orange-700";
  if (p === "Medium")   return "bg-yellow-100 text-yellow-700";
  return "bg-neutral-100 text-neutral-600";
}

function statusClass(s: string) {
  if (s === "Open")           return "border border-neutral-300 text-neutral-600";
  if (s === "In Progress")    return "bg-blue-100 text-blue-700";
  if (s === "Waiting Parts")  return "bg-orange-100 text-orange-700";
  return "bg-neutral-100 text-neutral-600";
}

function certStatusClass(s: string) {
  if (s === "Expired")       return "bg-red-100 text-red-700";
  if (s === "Expiring Soon") return "bg-orange-100 text-orange-700";
  return "bg-neutral-100 text-neutral-600";
}

// ── Components ─────────────────────────────────────────────────────────────────

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  subClass = "text-red-500",
}: {
  icon: React.ElementType;
  label: string;
  value: number | string;
  sub: string;
  subClass?: string;
}) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-500 mb-1">{label}</p>
          <p className="text-3xl font-semibold text-gray-900">{value}</p>
          <p className={`mt-1 text-xs ${subClass}`}>{sub}</p>
        </div>
        <Icon className="h-4 w-4 text-gray-400 mt-1" />
      </div>
    </div>
  );
}

function SectionHeader({ title, linkLabel = "View all" }: { title: string; linkLabel?: string }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
      <button className="flex items-center gap-0.5 text-xs text-gray-500 hover:text-gray-800">
        {linkLabel} <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export default function BackendDashboardPage() {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold text-gray-900">Back-end Dashboard</h1>
          <Bell className="h-5 w-5 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">Equipment, inspections, and compliance overview</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard icon={ClipboardCheck} label="Inspections Due"  value={15} sub="↑15 overdue" />
        <StatCard icon={Bell}           label="Failed / Adjust"  value={0}  sub="— last 30 days" subClass="text-gray-400" />
        <StatCard icon={Wrench}         label="Open Maintenance" value={6}  sub="↑1 critical" />
        <StatCard icon={Award}          label="Cert Alerts"      value={2}  sub="↑1 expired" />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-2 gap-4">
        {/* Left column */}
        <div className="space-y-4">
          {/* Overdue Inspections */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <SectionHeader title="Overdue Inspections" />
            <div className="divide-y divide-gray-100">
              {overdueInspections.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.id}</p>
                    <p className="text-xs text-gray-500">{item.name} - {item.category}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{item.daysAgo} days ago</span>
                    <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                      Critical
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Certificate Alerts */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <SectionHeader title="Certificate Alerts" />
            <div className="divide-y divide-gray-100">
              {certAlerts.map((cert) => (
                <div key={cert.name} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{cert.name}</p>
                    <p className="text-xs text-gray-500">{cert.cert}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">Exp: {cert.exp}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${certStatusClass(cert.status)}`}>
                      {cert.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Open Maintenance Tasks */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <SectionHeader title="Open Maintenance Tasks" />
            <div className="divide-y divide-gray-100">
              {maintenanceTasks.map((task) => (
                <div key={task.id} className="flex items-start justify-between py-2.5">
                  <div className="flex-1 min-w-0 pr-3">
                    <p className="text-sm font-medium text-gray-800">
                      {task.title} - <span className="text-gray-500">{task.id}</span>
                    </p>
                    <p className="text-xs text-gray-400 truncate">{task.desc}</p>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${priorityClass(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusClass(task.status)}`}>
                      {task.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Equipment Overview */}
          <div className="rounded-lg border border-gray-200 bg-white p-4">
            <SectionHeader title="Equipment Overview" linkLabel="Inventory" />
            <div className="space-y-1.5 mb-3">
              {equipmentOverview.statuses.map((row) => (
                <div key={row.badge} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${row.badgeClass}`}>
                      {row.badge}
                    </span>
                    <span className="text-xs text-gray-500">{row.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{row.count}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-gray-100 pt-3 space-y-1.5">
              {equipmentOverview.conditions.map((row) => (
                <div key={row.badge} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${row.badgeClass}`}>
                      {row.badge}
                    </span>
                    <span className="text-xs text-gray-500">{row.label}</span>
                  </div>
                  <span className="text-sm font-semibold text-gray-800">{row.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
