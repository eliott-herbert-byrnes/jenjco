import { Skeleton } from "@/components/ui/skeleton"

export function OrgStructureSkeleton() {
  return (
    <div className="relative flex h-full min-h-0 w-full flex-1 flex-col bg-muted/10">
      <div className="absolute top-[35px] left-[35px] flex max-w-xs flex-col gap-2 rounded-md border bg-card/95 p-3 shadow-sm">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-16" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4">
        <Skeleton className="h-20 w-44 rounded-xl" />
        <Skeleton className="h-10 w-px" />
        <div className="flex flex-wrap items-center justify-center gap-6">
          <Skeleton className="h-16 w-36 rounded-xl" />
          <Skeleton className="h-16 w-36 rounded-xl" />
          <Skeleton className="h-16 w-36 rounded-xl" />
        </div>
        <Skeleton className="h-10 w-px" />
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Skeleton className="h-14 w-32 rounded-lg" />
          <Skeleton className="h-14 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  )
}
