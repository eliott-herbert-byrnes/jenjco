import { Skeleton } from "@/components/ui/skeleton"

const ROW_COUNT = 4

export function WorkflowSummaryTableSkeleton() {
  return (
    <div className="rounded-2xl border">
      <div className="p-6 pb-4">
        <Skeleton className="h-6 w-40" />
      </div>
      <div className="flex flex-col gap-4 p-6 pt-0">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <Skeleton className="h-9 w-full max-w-xl" />
          <Skeleton className="h-9 w-[180px]" />
        </div>

        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>

        <div className="space-y-2">
          <div className="hidden px-3 sm:grid sm:grid-cols-[minmax(0,1fr)_6rem_5rem_5rem_minmax(0,9rem)_5rem_1.25rem] sm:gap-x-4">
            {Array.from({ length: 6 }, (_, index) => (
              <Skeleton key={index} className="h-3 w-12" />
            ))}
            <span className="sr-only">Expand</span>
          </div>

          {Array.from({ length: ROW_COUNT }, (_, index) => (
            <div
              key={index}
              className="rounded-lg border px-3 py-3 sm:grid sm:grid-cols-[minmax(0,1fr)_6rem_5rem_5rem_minmax(0,9rem)_5rem_1.25rem] sm:items-center sm:gap-x-4"
            >
              <Skeleton className="h-5 w-40" />
              <Skeleton className="hidden h-6 w-16 rounded-full sm:block" />
              <Skeleton className="hidden h-4 w-8 sm:block" />
              <Skeleton className="hidden h-4 w-8 sm:block" />
              <Skeleton className="hidden h-4 w-28 sm:block" />
              <Skeleton className="hidden h-4 w-10 sm:block" />
              <Skeleton className="ml-auto size-4 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
