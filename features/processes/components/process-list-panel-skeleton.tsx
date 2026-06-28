import { Skeleton } from "@/components/ui/skeleton"

const PROCESS_COUNTS = [4, 3, 3] as const

export function ProcessListPanelSkeleton() {
  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <Skeleton className="h-9 w-full" />
      <nav className="flex flex-col gap-1">
        {PROCESS_COUNTS.map((count, index) => (
          <DepartmentGroupSkeleton key={index} processCount={count} />
        ))}
      </nav>
    </div>
  )
}

function DepartmentGroupSkeleton({
  processCount,
}: {
  processCount: number
}) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Skeleton className="size-4 shrink-0" />
        <Skeleton className="h-4 w-28" />
      </div>
      <div className="space-y-1 pt-1 pl-2">
        {Array.from({ length: processCount }, (_, i) => (
          <div
            key={i}
            className="mb-1 rounded-md border border-transparent px-3 py-2"
          >
            <Skeleton className="h-4 w-full max-w-48" />
          </div>
        ))}
      </div>
    </div>
  )
}
