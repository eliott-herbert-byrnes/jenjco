import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { DeliveryLogsTable } from "@/features/analytics/components/delivery-logs-table"
import {
  buildDeliveryLogsHref,
  DELIVERY_LOGS_PAGE_SIZE,
  fetchDeliveryLogsPage,
  type DeliveryLogsFilterParams,
} from "@/lib/delivery-logs-query"
import { createClient } from "@/lib/supabase/server"

type DeliveryLogsResultsSectionProps = {
  orgId: string
  page: number
} & DeliveryLogsFilterParams

export async function DeliveryLogsResultsSection({
  orgId,
  page,
  search,
  status,
  event,
}: DeliveryLogsResultsSectionProps) {
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
    <>
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
    </>
  )
}
