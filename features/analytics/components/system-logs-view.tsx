import { paths } from "@/app/paths"
import { Badge } from "@/components/ui/badge"
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
import { SystemLogsFilters } from "@/features/analytics/components/system-logs-filters"
import { createClient } from "@/lib/supabase/server"

const PAGE_SIZE = 15

function pageHref(
  base: string,
  p: number,
  params: { search?: string; status?: string; type?: string }
) {
  const searchParams = new URLSearchParams()
  if (p > 0) searchParams.set("page", String(p))
  if (params.search) searchParams.set("search", params.search)
  if (params.status) searchParams.set("status", params.status)
  if (params.type) searchParams.set("type", params.type)
  const qs = searchParams.toString()
  return qs ? `${base}?${qs}` : base
}

export async function SystemLogsView({
  orgId,
  page = 0,
  search,
  status,
  type,
}: {
  orgId: string
  page?: number
  search?: string
  status?: string
  type?: string
}) {
  const supabase = await createClient()

  let query = supabase
    .from("usage_logs")
    .select(
      "id, resource_key, resource_type, run_id, step_id, tokens_in, tokens_out, duration_ms, status, created_at",
      { count: "exact" }
    )
    .eq("org_id", orgId)

  if (search) query = query.ilike("resource_key", `%${search}%`)
  if (status) query = query.eq("status", status)
  if (type) query = query.eq("resource_type", type)

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (error) throw new Error(error.message)

  const filterParams = { search, status, type }
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))
  const baseHref = paths.analyticsSystemLogs

  return (
    <Card>
      <CardHeader>
        <CardTitle>System Logs</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <SystemLogsFilters search={search} status={status} type={type} />

        {!data?.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No log entries match your filters
          </p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full font-mono text-xs">
              <thead className="border-b bg-muted/50">
                <tr>
                  {[
                    "Time",
                    "Resource",
                    "Type",
                    "Run ID",
                    "Step",
                    "In",
                    "Out",
                    "Duration",
                    "Status",
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-2 text-left font-medium text-muted-foreground"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((r) => (
                  <tr key={r.id} className="border-b last:border-0">
                    <td className="px-4 py-1.5 text-muted-foreground">
                      {new Date(r.created_at as string).toISOString()}
                    </td>
                    <td className="px-4 py-1.5">{r.resource_key}</td>
                    <td className="px-4 py-1.5">{r.resource_type}</td>
                    <td className="px-4 py-1.5 text-muted-foreground">
                      {r.run_id ? r.run_id.slice(0, 8) : "—"}
                    </td>
                    <td className="px-4 py-1.5 text-muted-foreground">
                      {r.step_id ?? "—"}
                    </td>
                    <td className="px-4 py-1.5 tabular-nums">{r.tokens_in ?? 0}</td>
                    <td className="px-4 py-1.5 tabular-nums">{r.tokens_out ?? 0}</td>
                    <td className="px-4 py-1.5 tabular-nums">
                      {r.duration_ms != null ? `${r.duration_ms}ms` : "—"}
                    </td>
                    <td className="px-4 py-1.5">
                      <Badge
                        variant={
                          r.status === "success" ? "default" : "destructive"
                        }
                      >
                        {r.status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t pt-3">
            <p className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages} · {count ?? 0} entries
            </p>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={pageHref(baseHref, page - 1, filterParams)}
                    className={
                      page === 0 ? "pointer-events-none opacity-50" : undefined
                    }
                    tabIndex={page === 0 ? -1 : undefined}
                    aria-disabled={page === 0}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href={pageHref(baseHref, page + 1, filterParams)}
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
