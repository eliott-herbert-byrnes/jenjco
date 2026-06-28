import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { SystemLogsTable } from "@/features/analytics/components/system-logs-table"
import {
  buildSystemLogsHref,
  type SystemLogsFilterParams,
} from "@/lib/date-range-filter"
import {
  buildSystemLogsQuery,
  SYSTEM_LOGS_PAGE_SIZE,
} from "@/lib/system-logs-query"
import { createClient } from "@/lib/supabase/server"

type SystemLogsResultsSectionProps = {
  orgId: string
  page: number
} & SystemLogsFilterParams

export async function SystemLogsResultsSection({
  orgId,
  page,
  search,
  status,
  type,
  team,
  from,
  to,
  tz,
}: SystemLogsResultsSectionProps) {
  const supabase = await createClient()

  const filterParams: SystemLogsFilterParams = {
    search,
    status,
    type,
    team,
    from,
    to,
    tz,
  }

  const [{ data: departments }, { data, count, error }] = await Promise.all([
    supabase
      .from("departments")
      .select("id, name, color")
      .eq("org_id", orgId)
      .order("sort_order"),
    buildSystemLogsQuery(supabase, orgId, filterParams, { count: "exact" }).range(
      page * SYSTEM_LOGS_PAGE_SIZE,
      (page + 1) * SYSTEM_LOGS_PAGE_SIZE - 1,
    ),
  ])

  if (error) throw new Error(error.message)

  const totalPages = Math.max(
    1,
    Math.ceil((count ?? 0) / SYSTEM_LOGS_PAGE_SIZE),
  )

  return (
    <>
      <SystemLogsTable
        rows={data ?? []}
        departments={departments ?? []}
        totalCount={count ?? 0}
        filters={filterParams}
      />

      {totalPages > 1 ? (
        <div className="flex items-center justify-between border-t pt-3">
          <p className="text-xs text-muted-foreground">
            Page {page + 1} of {totalPages} · {count ?? 0} entries
          </p>
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  href={buildSystemLogsHref(filterParams, {
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
                  href={buildSystemLogsHref(filterParams, {
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
