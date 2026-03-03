import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  PlusCircle,
  UserCheck,
  ClipboardList,
  AlertTriangle,
} from "lucide-react";

const actions = [
  {
    label: "New Booking",
    href: "/ops/bookings/new",
    icon: PlusCircle,
    variant: "default" as const,
    description: "Walk-in or phone reservation",
  },
  {
    label: "Check In Guest",
    href: "/ops/checkin",
    icon: UserCheck,
    variant: "success" as const,
    description: "Arrival & waiver processing",
  },
  {
    label: "Log Inspection",
    href: "/ops/equipment/inspect",
    icon: ClipboardList,
    variant: "outline" as const,
    description: "Equipment daily check",
  },
  {
    label: "Report Incident",
    href: "/ops/safety/report",
    icon: AlertTriangle,
    variant: "warning" as const,
    description: "Near-miss or incident",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-2">
        {actions.map((action) => (
          <Link key={action.href} href={action.href} className="block">
            <Button
              variant={action.variant}
              className="h-auto w-full flex-col gap-1 py-3 text-xs"
            >
              <action.icon className="h-5 w-5" />
              <span className="font-medium">{action.label}</span>
              <span className="hidden text-[10px] opacity-70 lg:block">
                {action.description}
              </span>
            </Button>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
