"use client"

import * as React from "react"
import { usePathname } from "next/navigation"

import { AppSidebar } from "@/components/app-sidebar"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/hooks/use-user"
import { cn } from "@/lib/utils"
import { DashboardHeader } from "./dashboard-header"

function isAgentsRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return pathname === "/agents" || pathname.startsWith("/agents/")
}

function isProcessesRoute(pathname: string | null): boolean {
  if (!pathname) return false
  return pathname === '/processes' || pathname.startsWith('/processes/')
}


export function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const agents = isAgentsRoute(pathname)
  const nopadding = agents || isProcessesRoute(pathname)

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AuthProvider>
          <AppSidebar />
          <SidebarInset className="overflow-x-hidden">
            <DashboardHeader />
            <div
              className={cn(
                "flex flex-1 flex-col gap-6",
                nopadding ? "p-0" : "p-4 md:p-6"
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
