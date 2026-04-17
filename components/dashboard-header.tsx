"use client"

import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Skeleton } from "@/components/ui/skeleton"
import { useUser } from "@/hooks/use-user"
import { cn } from "@/lib/utils"

function greetingName(
  displayName: string | null | undefined,
  email: string | null | undefined
): string {
  if (displayName?.trim()) return displayName.trim()
  if (email) return email.split("@")[0] ?? email
  return "there"
}

export function DashboardHeader({ className }: { className?: string }) {
  const { authUser, appUser, organization, isLoading } = useUser()

  const welcomeName = greetingName(
    appUser?.displayName ?? null,
    authUser?.email ?? null
  )
  const orgLabel =
    organization?.name?.trim() || organization?.slug?.trim() || "—"

  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4 md:px-6",
        className
      )}
    >
      <SidebarTrigger className="-ml-1" size={"lg"} />
      <Separator orientation="vertical" className="my-auto mr-2 h-6" />
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {isLoading ? (
          <>
            <Skeleton className="h-6 w-48 max-w-[min(100%,20rem)]" />
            <Skeleton className="h-4 w-64 max-w-full" />
          </>
        ) : (
          <>
            <h1 className="truncate text-lg font-semibold tracking-tight md:text-xl">
              <span className="text-muted-foreground">Welcome,</span>{" "}
              {welcomeName}
            </h1>
          </>
        )}
      </div>
      <Badge variant="outline" className="hidden shrink-0 sm:inline-flex bg-cyan-600/5 border-cyan-600 text-cyan-600 rounded-md">
        {isLoading ? <Skeleton className="h-5 w-24" /> : orgLabel}
      </Badge>
    </header>
  )
}
