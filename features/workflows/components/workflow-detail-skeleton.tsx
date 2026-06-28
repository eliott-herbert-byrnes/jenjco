import { Skeleton } from "@/components/ui/skeleton"

export function WorkflowDetailSkeleton() {
  return (
    <div className="flex h-[calc(100vh-4.5rem)] flex-col">
      <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
        <Skeleton className="h-8 w-28 rounded-md" />
        <Skeleton className="h-8 w-14 rounded-md" />
        <Skeleton className="h-8 w-12 rounded-md" />
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="relative min-h-0 flex-1 lg:w-2/3">
          <Skeleton className="absolute inset-0 rounded-none" />
          <div className="absolute bottom-4 left-4 flex flex-col gap-3">
            <Skeleton className="h-16 w-48 rounded-xl" />
            <Skeleton className="h-16 w-48 rounded-xl" />
            <Skeleton className="h-16 w-48 rounded-xl" />
          </div>
        </div>

        <div className="flex w-full shrink-0 flex-col overflow-hidden border-t lg:w-1/3 lg:border-t-0 lg:border-l">
          <div className="flex shrink-0 border-b">
            <Skeleton className="m-2 h-8 w-24 rounded-md" />
            <Skeleton className="m-2 h-8 w-16 rounded-md" />
          </div>
          <div className="flex flex-1 flex-col gap-3 p-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
      </div>
    </div>
  )
}
