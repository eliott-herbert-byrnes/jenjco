import { Skeleton } from "@/components/ui/skeleton"

export function IntegrationsPageSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </section>

      <section className="flex flex-col gap-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex w-full flex-row gap-4">
          <div className="w-full rounded-2xl border p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-2">
                <Skeleton className="size-8 rounded-md" />
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
