"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Sparkles,
  BookOpen,
  Settings,
  CalendarDays,
  CreditCard,
  HelpCircle,
  Globe,
  UserCog,
  ClipboardCheck,
  Wrench,
  Package,
  FileText,
  Award,
  Plug,
  Building2,
  Boxes,
  Bell,
  UserRoundSearch,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navSections = [
  {
    label: "Marketing",
    items: [
      { label: "Dashboard", href: "/marketing/dashboard", icon: LayoutDashboard },
      { label: "Leads", href: "/marketing/leads", icon: UserRoundSearch },
      { label: "AI Nurture", href: "/marketing/ai-nurture", icon: Sparkles },
      { label: "Content Hub", href: "/marketing/content-hub", icon: BookOpen },
      { label: "Settings", href: "/marketing/settings", icon: Settings },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Dashboard", href: "/ops/dashboard", icon: LayoutDashboard },
      { label: "Schedule", href: "/ops/schedule", icon: CalendarDays },
      { label: "Bookings", href: "/ops/bookings", icon: CalendarDays },
      { label: "Payments", href: "/ops/payments", icon: CreditCard },
      { label: "FAQ", href: "/ops/faq", icon: HelpCircle },
      { label: "Site Oracle", href: "/ops/site-oracle", icon: Globe },
    ],
  },
  {
    label: "Back-end",
    items: [
      { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
      { label: "Staffing", href: "/admin/staffing", icon: UserCog },
      { label: "Inspections", href: "/admin/inspections", icon: ClipboardCheck },
      { label: "Maintenance", href: "/admin/maintenance", icon: Wrench },
      { label: "Resources", href: "/admin/resources", icon: Package },
      { label: "Records", href: "/admin/records", icon: FileText },
      { label: "Certificates", href: "/admin/certificates", icon: Award },
      { label: "Integrations", href: "/admin/integrations", icon: Plug },
      { label: "Organization", href: "/admin/organization", icon: Building2 },
      { label: "Equipment", href: "/admin/equipment", icon: Boxes },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-48 flex-col bg-neutral-900 text-white">
      {/* Brand */}
      <div className="px-4 py-4 border-b border-neutral-800">
        <p className="text-sm font-bold text-white">Zipline OS</p>
        <p className="text-xs text-neutral-400">Operator Platform</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3">
        {navSections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-4 py-1 text-[10px] font-semibold uppercase tracking-widest text-neutral-500">
              {section.label}
            </p>
            {section.items.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2.5 px-4 py-1.5 text-sm transition-colors",
                    isActive
                      ? "text-white bg-neutral-700/50"
                      : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                  )}
                >
                  <item.icon className="h-3.5 w-3.5 flex-shrink-0" />
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-neutral-800 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-600 text-xs font-semibold text-white">
            JT
          </div>
          <div>
            <p className="text-xs font-medium text-white">Jake Torres</p>
            <p className="text-[10px] text-neutral-400">Manager</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
