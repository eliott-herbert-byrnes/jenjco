"use client"

import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { cn } from "@/lib/utils"

export function Header({ className, page, description }: { className?: string, page?: string, description?: string, }) {

  return (
    <header
      className={cn(
        "flex h-14 shrink-0 items-center gap-3 border-b bg-background px-4 md:px-6",
        className
      )}
    >
      <SidebarTrigger className="-ml-1" size={"lg"} />
      <Separator orientation="vertical" className="my-auto mr-2 h-6" />
      <div className="flex min-w-0 flex-1 gap-0.5 items-center">
        <h1 className="truncate font-semibold tracking-tight">
          <span className="">{page}</span>
        </h1>
        <Separator orientation="vertical" className="my-auto ml-4 mr-2 h-6" />
        <h2 className="truncate tracking-tight text-muted-foreground ml-1">
          <span>
            {description}
          </span>
        </h2>
      </div>
    </header>
  )
}
