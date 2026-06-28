import { Skeleton } from "@/components/ui/skeleton"

const ROW_COUNT = 8

export function SystemLogsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-7 w-20 rounded-full" />
          ))}
        </div>
        <div className="ml-auto flex gap-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-28" />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <div className="border-b bg-muted/50 px-4 py-2">
          <div className="flex gap-4 pl-6">
            {Array.from({ length: 10 }, (_, index) => (
              <Skeleton key={index} className="h-3 w-12" />
            ))}
          </div>
        </div>
        <div className="divide-y">
          {Array.from({ length: ROW_COUNT }, (_, index) => (
            <div key={index} className="flex items-center gap-4 px-4 py-2.5">
              <Skeleton className="size-4 shrink-0 rounded-sm" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-8" />
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between border-t pt-3">
        <Skeleton className="h-3 w-36" />
        <div className="flex gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      </div>
    </div>
  )
}
