"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  UserCheck,
  Users,
  Wrench,
  ShieldAlert,
  BarChart3,
  Settings,
  LogOut,
  Zap,
  Mountain,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  {
    label: "Dashboard",
    href: "/ops/dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "Bookings",
    href: "/ops/bookings",
    icon: CalendarDays,
  },
  {
    label: "Check-In",
    href: "/ops/checkin",
    icon: UserCheck,
  },
  {
    label: "Staff",
    href: "/ops/staff",
    icon: Users,
  },
  {
    label: "Equipment",
    href: "/ops/equipment",
    icon: Wrench,
  },
  {
    label: "Safety",
    href: "/ops/safety",
    icon: ShieldAlert,
  },
  {
    label: "Reports",
    href: "/ops/reports",
    icon: BarChart3,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col border-r bg-slate-900 text-white">
      {/* Brand */}
      <div className="flex items-center gap-3 border-b border-slate-700 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-skyline-500">
          <Mountain className="h-5 w-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold tracking-wide">Skyline</p>
          <p className="flex items-center gap-1 text-xs text-skyline-400">
            <Zap className="h-3 w-3" />
            Zipline OS
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-skyline-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-slate-700 px-3 py-3 space-y-1">
        <Link
          href="/ops/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <Settings className="h-5 w-5" />
          Settings
        </Link>
        <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 hover:bg-slate-800 hover:text-white transition-colors">
          <LogOut className="h-5 w-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
