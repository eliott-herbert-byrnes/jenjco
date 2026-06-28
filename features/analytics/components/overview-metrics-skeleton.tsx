import { Skeleton } from "@/components/ui/skeleton"

const CARD_COUNT = 6

export function OverviewMetricsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {Array.from({ length: CARD_COUNT }, (_, index) => (
        <div key={index} className="rounded-2xl border p-4">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-8 w-16" />
        </div>
      ))}
    </div>
  )
}
