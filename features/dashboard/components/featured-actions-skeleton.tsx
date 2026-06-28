import { Skeleton } from "@/components/ui/skeleton"

export function FeaturedActionsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-[2fr_1fr_1fr]">
      <div className="flex flex-col gap-4 rounded-2xl border p-6">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-full max-w-sm" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Skeleton className="size-6" />
            <Skeleton className="size-6" />
            <Skeleton className="size-6" />
          </div>
          <Skeleton className="h-9 w-24" />
        </div>
      </div>
      <div className="flex flex-col gap-4 rounded-2xl border p-6">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="mt-auto h-9 w-full" />
      </div>
      <div className="flex flex-col gap-4 rounded-2xl border p-6">
        <Skeleton className="h-6 w-36" />
        <Skeleton className="mt-auto h-9 w-full" />
      </div>
    </div>
  )
}
