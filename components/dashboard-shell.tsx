"use client"

import * as React from "react"

import { AppSidebar } from "@/components/app-sidebar"

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/hooks/use-user"
import { DashboardHeader } from "./dashboard-header"

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <AuthProvider>
          <AppSidebar />
          <SidebarInset className="overflow-x-hidden">
            <DashboardHeader />
            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">{children}</div>
          </SidebarInset>
        </AuthProvider>
      </SidebarProvider>
    </TooltipProvider>
  )
}
