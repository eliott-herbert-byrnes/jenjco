import { Skeleton } from "@/components/ui/skeleton"

const ROW_COUNT = 8

export function DeliveryLogsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-lg border">
        <div className="border-b bg-muted/50 px-4 py-2">
          <div className="flex gap-4">
            {Array.from({ length: 7 }, (_, index) => (
              <Skeleton key={index} className="h-3 w-16" />
            ))}
          </div>
        </div>
        <div className="divide-y">
          {Array.from({ length: ROW_COUNT }, (_, index) => (
            <div key={index} className="flex gap-4 px-4 py-2.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-14 rounded-full" />
              <Skeleton className="h-4 w-24" />
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
