import { Skeleton } from "@/components/ui/skeleton"

const ROW_COUNT = 4

export function UsersSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border">
        <div className="flex flex-col gap-1.5 p-6 pb-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-4 w-72 max-w-full" />
        </div>
        <div className="flex flex-col gap-4 p-6 pt-0">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-32" />
        </div>
      </div>

      <div className="rounded-2xl border">
        <div className="p-6 pb-4">
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-[640px] border-t">
            <div className="grid grid-cols-7 gap-4 border-b bg-muted/50 px-4 py-2">
              {Array.from({ length: 7 }, (_, index) => (
                <Skeleton key={index} className="h-3 w-12" />
              ))}
            </div>
            {Array.from({ length: ROW_COUNT }, (_, index) => (
              <div
                key={index}
                className="grid grid-cols-7 items-center gap-4 border-b px-4 py-2 last:border-0"
              >
                <div className="flex items-center gap-2">
                  <Skeleton className="size-7 shrink-0 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-6 w-14 rounded-full" />
                <Skeleton className="h-4 w-16" />
                <div className="flex justify-end gap-1">
                  <Skeleton className="size-8 rounded-md" />
                  <Skeleton className="size-8 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
