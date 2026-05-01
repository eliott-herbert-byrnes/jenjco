"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/hooks/use-user"
import { cn } from "@/lib/utils"
import { DashboardHeader } from "./dashboard-header"

function isDashboardRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return pathname === '/'
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const dashboard = isDashboardRoute(pathname)

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AuthProvider>
          <AppSidebar />
          <SidebarInset className="overflow-x-hidden">
            <DashboardHeader />
            <div
              className={cn(
                "flex flex-1 flex-col gap-6 p-0",
                dashboard ? "p-4" : "p-0 md:p-0"
              )}
            >
              {children}
            </div>
          </SidebarInset>
        </AuthProvider>
      </SidebarProvider>
    </TooltipProvider>
  )
}
