"use client"

import { useState, useEffect } from "react"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { TopBar } from "@/components/top-bar"
import { AppStoreProvider } from "@/lib/mock-store"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Gate all rendering to client-only to avoid hydration mismatches from
  // seeded PRNG mock data that can diverge between SSR and client.
  const [ready, setReady] = useState(false)
  useEffect(() => { setReady(true) }, [])

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">Loading Zipline OS...</p>
        </div>
      </div>
    )
  }

  return (
    <AppStoreProvider>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <TopBar />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
    </AppStoreProvider>
  )
}
