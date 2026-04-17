"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BotIcon,
  ClipboardListIcon,
  FileStackIcon,
  GitBranchIcon,
  LayoutDashboardIcon,
  NetworkIcon,
} from "lucide-react"

import { paths } from "@/app/paths"
import { UserAccountMenu } from "@/components/user-account-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  // SidebarRail,
} from "@/components/ui/sidebar"

const NAV_ITEMS = [
  { title: "Dashboard", href: paths.dashboard, icon: LayoutDashboardIcon },
  { title: "Agents", href: paths.agents, icon: BotIcon },
  { title: "Workflows", href: paths.workflows, icon: GitBranchIcon },
  { title: "Processes", href: paths.processes, icon: FileStackIcon },
  { title: "Org Structure", href: paths.orgStructure, icon: NetworkIcon },
  { title: "Audit", href: paths.audit, icon: ClipboardListIcon },
] as const

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname() ?? ""

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={paths.dashboard}>
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <LayoutDashboardIcon className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">JENJCO</span>
                  <span className="truncate text-xs text-muted-foreground">
                    v 1.0.0
                  </span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  tooltip={item.title}
                  isActive={isActivePath(pathname, item.href)}
                >
                  <Link href={item.href}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <UserAccountMenu />
      </SidebarFooter>
    </Sidebar>
  )
}
