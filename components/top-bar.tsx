"use client"

import { Bell, X, CheckCheck, Trash2, AlertTriangle, FileWarning, CreditCard, Shield, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { formatDistanceToNow } from "date-fns"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover"
import { LocationSwitcher } from "@/components/location-switcher"
import { useAppStore } from "@/lib/mock-store"
import type { Notification } from "@/lib/types"
import { cn } from "@/lib/utils"

const notifIcons: Record<Notification["type"], React.ReactNode> = {
  overbooked: <AlertTriangle className="h-4 w-4 text-destructive" />,
  waiver: <FileWarning className="h-4 w-4 text-accent" />,
  certificate: <Shield className="h-4 w-4 text-destructive" />,
  maintenance: <AlertTriangle className="h-4 w-4 text-accent" />,
  payment: <CreditCard className="h-4 w-4 text-accent" />,
  general: <Info className="h-4 w-4 text-muted-foreground" />,
}

// Map notification types to the appropriate route so clicking navigates there
const notifRoutes: Record<Notification["type"], string> = {
  overbooked: "/ops/schedule",
  waiver: "/ops/schedule",
  certificate: "/admin/certificates",
  maintenance: "/admin/maintenance",
  payment: "/ops/payments",
  general: "/ops/dashboard",
}

export function TopBar() {
  const { state, dispatch } = useAppStore()
  const router = useRouter()
  const notifications = state.notifications
  const unreadCount = notifications.filter(n => !n.read).length
  const readCount = notifications.filter(n => n.read).length

  const handleNotifClick = (notif: Notification) => {
    if (!notif.read) {
      dispatch({ type: "MARK_NOTIFICATION_READ", id: notif.id })
    }
    router.push(notifRoutes[notif.type])
  }

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b bg-background px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-2 h-4" />
      <LocationSwitcher />
      <div className="flex-1" />
      <div className="flex items-center gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-4 w-4" />
              {unreadCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                  {unreadCount}
                </span>
              )}
              <span className="sr-only">Notifications</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent align="end" className="w-96 p-0">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h4 className="text-sm font-semibold">Notifications</h4>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => {
                      notifications.filter(n => !n.read).forEach(n => {
                        dispatch({ type: "MARK_NOTIFICATION_READ", id: n.id })
                      })
                    }}
                  >
                    <CheckCheck className="mr-1 h-3 w-3" />
                    Mark all read
                  </Button>
                )}
                {readCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-muted-foreground"
                    onClick={() => dispatch({ type: "CLEAR_READ_NOTIFICATIONS" })}
                  >
                    <Trash2 className="mr-1 h-3 w-3" />
                    Clear read
                  </Button>
                )}
              </div>
            </div>
            <ScrollArea className="h-[400px]">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Bell className="mb-2 h-8 w-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground">All caught up!</p>
                  <p className="text-xs text-muted-foreground/60">No notifications to show.</p>
                </div>
              ) : (
                <div className="flex flex-col">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className={cn(
                        "group flex items-start gap-3 border-b px-4 py-3 transition-colors last:border-0 cursor-pointer hover:bg-muted/50",
                        !notif.read && "bg-primary/5"
                      )}
                      onClick={() => handleNotifClick(notif)}
                    >
                      <div className="mt-0.5 shrink-0">
                        {notifIcons[notif.type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn("text-sm", !notif.read && "font-medium")}>{notif.title}</p>
                          {!notif.read && (
                            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{notif.description}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground/60">
                          {formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="mt-0.5 h-6 w-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation()
                          dispatch({ type: "DISMISS_NOTIFICATION", id: notif.id })
                        }}
                      >
                        <X className="h-3 w-3" />
                        <span className="sr-only">Dismiss notification</span>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            {notifications.length > 0 && (
              <div className="border-t px-4 py-2">
                <p className="text-center text-xs text-muted-foreground">
                  {unreadCount} unread, {notifications.length} total
                </p>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </header>
  )
}
