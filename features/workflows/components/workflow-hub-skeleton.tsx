import { Skeleton } from "@/components/ui/skeleton"

const ROW_COUNT = 5

export function WorkflowHubSkeleton() {
  return (
    <div className="mx-auto flex w-full flex-col gap-6 px-6 py-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <Skeleton className="h-9 w-full max-w-xl" />
        <Skeleton className="h-9 w-36 shrink-0" />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-7 w-24 rounded-full" />
          <Skeleton className="h-7 w-28 rounded-full" />
          <Skeleton className="h-7 w-20 rounded-full" />
          <Skeleton className="h-7 w-32 rounded-full" />
        </div>
        <Skeleton className="h-9 w-full md:w-[200px]" />
      </div>

      <div className="space-y-3">
        <div className="hidden px-4 md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.7fr)_2.5rem] md:gap-4">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-10" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-3 w-16" />
          <span className="sr-only">Actions</span>
        </div>

        {Array.from({ length: ROW_COUNT }, (_, index) => (
          <WorkflowHubRowSkeleton key={index} />
        ))}
      </div>
    </div>
  )
}

function WorkflowHubRowSkeleton() {
  return (
    <>
      <div className="hidden rounded-xl border px-4 py-3 md:grid md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.7fr)_2.5rem] md:items-center md:gap-4">
        <Skeleton className="h-5 w-3/4 max-w-xs" />
        <Skeleton className="h-6 w-20 rounded-full" />
        <Skeleton className="h-6 w-16 rounded-full" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-10" />
        <Skeleton className="size-8 rounded-md" />
      </div>

      <div className="rounded-xl border px-4 py-3 md:hidden">
        <div className="flex items-start justify-between gap-2">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="size-8 shrink-0 rounded-md" />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </>
  )
}
