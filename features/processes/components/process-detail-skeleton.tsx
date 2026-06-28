import { Skeleton } from "@/components/ui/skeleton"

export function ProcessDetailSkeleton() {
  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto">
      <header className="shrink-0 border-b px-4 py-5 sm:px-6">
        <Skeleton className="h-7 w-2/3 max-w-md" />
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Skeleton className="h-8 w-24 rounded-full" />
          <Skeleton className="h-8 w-36 rounded-md" />
          <Skeleton className="h-4 w-28" />
        </div>
      </header>
      <div className="flex w-full flex-1 flex-col gap-3 px-6 py-6">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  )
}
