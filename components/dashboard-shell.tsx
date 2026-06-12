"use client"

import * as React from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AuthProvider } from "@/hooks/use-user"
import { cn } from "@/lib/utils"

export function DashboardShell({ children }: { children: React.ReactNode }) {

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AuthProvider>
          <AppSidebar />
          <SidebarInset className="overflow-x-hidden">
            <div
              className={cn(
                "flex flex-1 flex-col gap-0 p-0",
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
