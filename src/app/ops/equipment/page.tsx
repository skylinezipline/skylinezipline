import { Metadata } from "next";
import { Topbar } from "@/components/layout/topbar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, getStatusColor } from "@/lib/utils";
import { mockEquipment } from "@/lib/mock-data";
import {
  Wrench,
  PlusCircle,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ClipboardList,
  Package,
} from "lucide-react";

export const metadata: Metadata = { title: "Equipment" };

const categoryIcons: Record<string, string> = {
  HARNESS: "🦺",
  HELMET: "⛑️",
  TROLLEY: "🔧",
  CARABINER: "🔗",
  BRAKE_SYSTEM: "🛑",
  CABLE: "〰️",
  ANCHOR: "⚓",
  GLOVES: "🧤",
  COMMUNICATION: "📻",
  RESCUE_GEAR: "🚨",
  OTHER: "📦",
};

const categoryLabels: Record<string, string> = {
  HARNESS: "Harness",
  HELMET: "Helmet",
  TROLLEY: "Trolley",
  CARABINER: "Carabiner",
  BRAKE_SYSTEM: "Brake System",
  CABLE: "Cable",
  ANCHOR: "Anchor",
  GLOVES: "Gloves",
  COMMUNICATION: "Radio/Comms",
  RESCUE_GEAR: "Rescue Gear",
  OTHER: "Other",
};

const statusIcons: Record<string, React.ElementType> = {
  IN_SERVICE: CheckCircle,
  OUT_OF_SERVICE: XCircle,
  UNDER_INSPECTION: Clock,
  RETIRED: Package,
};

const statusIconColors: Record<string, string> = {
  IN_SERVICE: "text-green-600",
  OUT_OF_SERVICE: "text-red-600",
  UNDER_INSPECTION: "text-yellow-600",
  RETIRED: "text-gray-400",
};

export default function EquipmentPage() {
  const outOfService = mockEquipment.filter((e) => e.status === "OUT_OF_SERVICE");
  const underInspection = mockEquipment.filter((e) => e.status === "UNDER_INSPECTION");

  return (
    <div className="flex flex-col">
      <Topbar
        title="Equipment & Gear"
        subtitle="Inventory management and inspection tracking"
      />

      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name or serial..." className="w-64 pl-8" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Daily Inspection
            </Button>
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Add Equipment
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {(outOfService.length > 0 || underInspection.length > 0) && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-semibold text-red-800">
                {outOfService.length} item(s) out of service · {underInspection.length} under inspection
              </p>
            </div>
            <div className="space-y-1.5">
              {[...outOfService, ...underInspection].map((e) => (
                <div key={e.id} className="flex items-center justify-between rounded-lg bg-white border border-red-200 px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{e.name}</p>
                    <p className="text-xs text-muted-foreground">S/N: {e.serialNumber}</p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                      getStatusColor(e.status)
                    )}
                  >
                    {e.status.replace(/_/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: "In Service", value: mockEquipment.filter((e) => e.status === "IN_SERVICE").length, color: "text-green-600" },
            { label: "Out of Service", value: outOfService.length, color: "text-red-600" },
            { label: "Under Inspection", value: underInspection.length, color: "text-yellow-600" },
            { label: "Total Items", value: mockEquipment.length, color: "text-slate-700" },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <p className={cn("text-3xl font-bold", s.color)}>{s.value}</p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Equipment List */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center gap-2">
            <Wrench className="h-5 w-5 text-muted-foreground" />
            <CardTitle className="text-base font-semibold">Equipment Inventory</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50">
                    {["", "Item", "Serial #", "Manufacturer / Model", "Last Inspection", "Next Due", "Status", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {mockEquipment.map((item) => {
                    const StatusIcon = statusIcons[item.status] ?? CheckCircle;
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 text-lg">
                          {categoryIcons[item.category] ?? "📦"}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{item.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {categoryLabels[item.category]}
                          </p>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {item.serialNumber}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {item.manufacturer} {item.model}
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">
                          {item.lastInspection}
                        </td>
                        <td className="px-4 py-3 text-xs">
                          {item.nextInspection ? (
                            <span
                              className={cn(
                                item.status === "OUT_OF_SERVICE"
                                  ? "text-red-600 font-medium"
                                  : "text-muted-foreground"
                              )}
                            >
                              {item.nextInspection}
                            </span>
                          ) : (
                            <span className="text-red-600 font-medium">Overdue</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <StatusIcon
                              className={cn(
                                "h-4 w-4",
                                statusIconColors[item.status]
                              )}
                            />
                            <span
                              className={cn(
                                "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
                                getStatusColor(item.status)
                              )}
                            >
                              {item.status.replace(/_/g, " ")}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Button variant="outline" size="sm" className="text-xs gap-1">
                            <ClipboardList className="h-3.5 w-3.5" />
                            Inspect
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
