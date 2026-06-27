"use client"

import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { paths } from "@/app/paths"
import { useUser } from "@/hooks/use-user"
import { createClient } from "@/lib/supabase/client"
import {
  BadgeCheckIcon,
  BellIcon,
  ChevronsUpDownIcon,
  LogOutIcon,
  LucideSun,
  SettingsIcon,
} from "lucide-react"
import { useTheme } from "next-themes"

function initials(
  displayName: string | null | undefined,
  email: string | null | undefined
): string {
  const n = displayName?.trim()
  if (n) {
    const parts = n.split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase()
    }
    return n.slice(0, 2).toUpperCase()
  }
  if (email) return email.slice(0, 2).toUpperCase()
  return "?"
}

export function UserAccountMenu() {
  const router = useRouter()
  const { isMobile } = useSidebar()
  const { authUser, appUser, isLoading } = useUser()
  const { resolvedTheme, setTheme } = useTheme()

  const name =
    appUser?.displayName?.trim() || authUser?.email?.split("@")[0] || "Account"
  const email = appUser?.email ?? authUser?.email ?? ""

  async function signOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push(paths.signIn)
    router.refresh()
  }

  function switchTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark")
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
              disabled={isLoading}
              aria-label="Account menu"
            >
              {isLoading ? (
                <>
                  <Skeleton className="size-8 shrink-0 rounded-lg" />
                  <div className="grid min-w-0 flex-1 gap-1 text-left text-sm leading-tight">
                    <Skeleton className="h-4 w-24 max-w-full" />
                    <Skeleton className="h-3 w-32 max-w-full" />
                  </div>
                  <ChevronsUpDownIcon className="ml-auto size-4 shrink-0 opacity-50" />
                </>
              ) : (
                <>
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage src="" alt="" />
                    <AvatarFallback className="rounded-lg text-xs">
                      {initials(appUser?.displayName, authUser?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{name}</span>
                    <span className="truncate text-xs">{email || "—"}</span>
                  </div>
                  <ChevronsUpDownIcon className="ml-auto size-4 shrink-0" />
                </>
              )}
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src="" alt="" />
                  <AvatarFallback className="rounded-lg">
                    {initials(appUser?.displayName, authUser?.email)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid min-w-0 flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">{name}</span>
                  <span className="truncate text-xs text-muted-foreground">
                    {email || "—"}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => void switchTheme()}>
                <LucideSun />
                Theme
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => void signOut()}>
              <LogOutIcon />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
