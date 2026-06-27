import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { DeliveryLogsFilters } from "@/features/analytics/components/delivery-logs-filters"
import { DeliveryLogsTable } from "@/features/analytics/components/delivery-logs-table"
import {
  buildDeliveryLogsHref,
  DELIVERY_LOGS_PAGE_SIZE,
  fetchDeliveryLogsPage,
  type DeliveryLogsFilterParams,
} from "@/lib/delivery-logs-query"
import { createClient } from "@/lib/supabase/server"

export async function DeliveryLogsView({
  orgId,
  page = 0,
  search,
  status,
  event,
}: {
  orgId: string
  page?: number
} & DeliveryLogsFilterParams) {
  const supabase = await createClient()

  const filterParams: DeliveryLogsFilterParams = {
    search,
    status,
    event,
  }

  const { data, count, error } = await fetchDeliveryLogsPage(
    supabase,
    orgId,
    filterParams,
    page,
  )

  if (error) throw new Error(error.message)

  const totalPages = Math.max(
    1,
    Math.ceil((count ?? 0) / DELIVERY_LOGS_PAGE_SIZE),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Logs</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <DeliveryLogsFilters {...filterParams} />

        <DeliveryLogsTable rows={data ?? []} />

        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages} · {count ?? 0} entries
            </p>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={buildDeliveryLogsHref(filterParams, {
                      page: page > 0 ? page - 1 : undefined,
                    })}
                    className={
                      page === 0 ? "pointer-events-none opacity-50" : undefined
                    }
                    tabIndex={page === 0 ? -1 : undefined}
                    aria-disabled={page === 0}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href={buildDeliveryLogsHref(filterParams, {
                      page: page + 1,
                    })}
                    className={
                      page >= totalPages - 1
                        ? "pointer-events-none opacity-50"
                        : undefined
                    }
                    tabIndex={page >= totalPages - 1 ? -1 : undefined}
                    aria-disabled={page >= totalPages - 1}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
