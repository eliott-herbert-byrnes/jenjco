import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

const ROW_COUNT = 8

export function AnalyticsIntegrationsSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[720px] border-b bg-muted/50 px-4 py-2">
            <div className="flex gap-8">
              {["Provider", "Endpoint", "Status", "Error", "Time"].map(
                (header) => (
                  <Skeleton key={header} className="h-3 w-16" />
                ),
              )}
            </div>
          </div>
          <div className="divide-y">
            {Array.from({ length: ROW_COUNT }, (_, index) => (
              <div key={index} className="flex gap-8 px-4 py-2.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between border-t px-4 py-3">
          <Skeleton className="h-3 w-40" />
          <div className="flex gap-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-16" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
