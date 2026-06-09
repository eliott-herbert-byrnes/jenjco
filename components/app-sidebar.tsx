"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Building2Icon,
  ClipboardListIcon,
  GitBranchIcon,
  HomeIcon,
  LayoutDashboardIcon,
} from "lucide-react"

import { paths } from "@/app/paths"
import { NavMain } from "@/components/nav-main"
import { useUser } from "@/hooks/use-user"
import { UserAccountMenu } from "@/components/user-account-menu"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function isOrganisationSectionActive(pathname: string) {
  return (
    isActivePath(pathname, paths.organisation) ||
    isActivePath(pathname, paths.orgStructure) ||
    isActivePath(pathname, paths.processes) ||
    isActivePath(pathname, paths.integrations) ||
    isActivePath(pathname, paths.organisationUsers)
  )
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname() ?? ""
  const { appUser } = useUser()
  const isAdmin = appUser?.role === "admin"
  const organisationActive = isOrganisationSectionActive(pathname)

  const organisationSubItems = [
    {
      title: "Org Structure",
      url: paths.orgStructure,
      isActive: isActivePath(pathname, paths.orgStructure),
    },
    {
      title: "Processes",
      url: paths.processes,
      isActive: isActivePath(pathname, paths.processes),
    },
    ...(isAdmin
      ? [
          {
            title: "Integrations",
            url: paths.integrations,
            isActive: isActivePath(pathname, paths.integrations),
          },
          {
            title: "Users",
            url: paths.organisationUsers,
            isActive: isActivePath(pathname, paths.organisationUsers),
          },
        ]
      : []),
  ]

  const navItems = [
    {
      title: "Dashboard",
      url: paths.dashboard,
      icon: HomeIcon,
      isActive: isActivePath(pathname, paths.workflows),
    },
    {
      title: "Organisation",
      url: paths.organisation,
      icon: Building2Icon,
      isActive: organisationActive,
      items: organisationSubItems,
    },
    {
      title: "Workflows",
      url: paths.workflows,
      icon: GitBranchIcon,
      isActive: isActivePath(pathname, paths.workflows),
    },
    {
      title: "Audit",
      url: paths.audit,
      icon: ClipboardListIcon,
      isActive: isActivePath(pathname, paths.audit),
    },
  ]

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
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <UserAccountMenu />
      </SidebarFooter>
    </Sidebar>
  )
}
