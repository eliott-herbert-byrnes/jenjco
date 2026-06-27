"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart2Icon,
  Building2Icon,
  GitBranchIcon,
  HomeIcon,
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
import Image from "next/image"

function isActivePath(pathname: string, href: string) {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

function isOrganisationSectionActive(pathname: string) {
  return (
    isActivePath(pathname, paths.orgStructure) ||
    isActivePath(pathname, paths.processes) ||
    isActivePath(pathname, paths.integrations) ||
    isActivePath(pathname, paths.organisationUsers)
  )
}

function isAnalyticsSectionActive(pathname: string) {
  return pathname.startsWith("/analytics")
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname() ?? ""
  const { appUser } = useUser()
  const isAdmin = appUser?.role === "admin"
  const organisationActive = isOrganisationSectionActive(pathname)
  const analyticsActive = isAnalyticsSectionActive(pathname)

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
    ...(isAdmin
      ? [
          {
            title: "Analytics",
            icon: BarChart2Icon,
            isActive: analyticsActive,
            items: [
              {
                title: "Overview",
                url: paths.analyticsOverview,
                isActive: isActivePath(pathname, paths.analyticsOverview),
              },
              {
                title: "System Logs",
                url: paths.analyticsSystemLogs,
                isActive: isActivePath(pathname, paths.analyticsSystemLogs),
              },
              {
                title: "Integrations",
                url: paths.analyticsIntegrations,
                isActive: isActivePath(pathname, paths.analyticsIntegrations),
              },
            ],
          },
        ]
      : []),
  ]

  return (
    <Sidebar collapsible="icon" variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Link href={paths.dashboard}>
                  <Image
                    width="7"
                    height="7"
                    src="/logo.svg"
                    alt="JENJCO"
                    className="size-7 shrink-0 ml-1 mt-1"
                  />
                  <div className="grid flex-1 text-left text-sm leading-tight mt-1.5">
                    <span className="truncate font-semibold">JENJCO</span>
                    <span className="truncate text-xs text-muted-foreground">
                      v 0.1.0
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
