import { Skeleton } from "@/components/ui/skeleton"

export function WorkflowBrowserSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <Skeleton className="h-9 w-full" />
      <div className="mb-2 flex flex-wrap gap-2">
        <Skeleton className="h-7 w-24 rounded-full" />
        <Skeleton className="h-7 w-28 rounded-full" />
        <Skeleton className="h-7 w-20 rounded-full" />
        <Skeleton className="h-7 w-32 rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <WorkflowCardSkeleton />
        <WorkflowCardSkeleton />
        <WorkflowCardSkeleton />
        <WorkflowCardSkeleton />
      </div>
    </div>
  )
}

function WorkflowCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border p-6">
      <Skeleton className="h-5 w-24" />
      <Skeleton className="h-6 w-3/4" />
      <div className="flex gap-2">
        <Skeleton className="size-6 rounded-md" />
        <Skeleton className="size-6 rounded-md" />
      </div>
    </div>
  )
}
