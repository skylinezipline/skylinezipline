"use client"

import {
  BarChart3, Users, Sparkles, Settings, Camera,
  LayoutDashboard, Calendar, BookOpen, HelpCircle, Orbit, Receipt,
  Gauge, ClipboardCheck, Wrench, Library, Archive, Award, Plug, Building2, Package,
  Mountain, CalendarClock,
} from "lucide-react"
import { usePathname } from "next/navigation"
import Link from "next/link"

import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader,
  SidebarFooter, SidebarRail,
} from "@/components/ui/sidebar"

const navSections = [
  {
    label: "Marketing",
    items: [
      { title: "Dashboard", url: "/marketing/dashboard", icon: BarChart3 },
      { title: "Leads", url: "/marketing/leads", icon: Users },
      { title: "AI Nurture", url: "/marketing/nurture", icon: Sparkles },
      { title: "Content Hub", url: "/marketing/content", icon: Camera },
      { title: "Settings", url: "/marketing/settings", icon: Settings },
    ],
  },
  {
    label: "Operations",
    items: [
      { title: "Dashboard", url: "/ops/dashboard", icon: LayoutDashboard },
      { title: "Schedule", url: "/ops/schedule", icon: Calendar },
      { title: "Bookings", url: "/ops/bookings", icon: BookOpen },

      { title: "Payments", url: "/ops/payments", icon: Receipt },
      { title: "FAQ", url: "/ops/faq", icon: HelpCircle },
      { title: "Site Oracle", url: "/ops/oracle", icon: Orbit },
    ],
  },
  {
    label: "Back-end",
    items: [
      { title: "Dashboard", url: "/admin/dashboard", icon: Gauge },
      { title: "Staffing", url: "/admin/staffing", icon: CalendarClock },
      { title: "Inspections", url: "/admin/inspections", icon: ClipboardCheck },
      { title: "Maintenance", url: "/admin/maintenance", icon: Wrench },
      { title: "Resources", url: "/admin/resources", icon: Library },
      { title: "Records", url: "/admin/records", icon: Archive },
      { title: "Certificates", url: "/admin/certificates", icon: Award },
      { title: "Integrations", url: "/admin/integrations", icon: Plug },
      { title: "Organization", url: "/admin/org", icon: Building2 },
      { title: "Equipment", url: "/admin/equipment-inventory", icon: Package },
    ],
  },
]

export function AppSidebar() {
  const pathname = usePathname()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href="/ops/dashboard">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <Mountain className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">Zipline OS</span>
                  <span className="text-xs text-sidebar-foreground/60">Operator Platform</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {navSections.map((section) => (
          <SidebarGroup key={section.label}>
            <SidebarGroupLabel>{section.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.url}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.url || pathname?.startsWith(item.url + "/")}
                      tooltip={item.title}
                    >
                      <Link href={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg">
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
                <span className="text-xs font-bold">JT</span>
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="text-sm font-medium">Jake Torres</span>
                <span className="text-xs text-sidebar-foreground/60">Manager</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
