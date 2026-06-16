import { paths } from "@/app/paths"
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
import { createClient } from "@/lib/supabase/server"

const PAGE_SIZE = 20

function pageHref(base: string, p: number) {
  return `${base}&page=${p}`
}

export async function LogsView({
  orgId,
  page = 0,
}: {
  orgId: string
  page?: number
}) {
  const supabase = await createClient()
  // Intentionally unfiltered: shows roll-up rows (agent/workflow) and workflow_step detail.
  const { data, count } = await supabase
    .from("usage_logs")
    .select(
      "id, resource_key, resource_type, run_id, step_id, tokens_in, tokens_out, cost_estimate, duration_ms, status, created_at",
      { count: "exact" }
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))
  const baseHref = `${paths.audit}?tab=logs`

  if (!data?.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No log entries yet
      </p>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Raw Logs</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
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
                "Cost",
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
                  ${Number(r.cost_estimate ?? 0).toFixed(6)}
                </td>
                <td className="px-4 py-1.5 tabular-nums">
                  {r.duration_ms != null ? `${r.duration_ms}ms` : "—"}
                </td>
                <td className="px-4 py-1.5">{r.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages} · {count ?? 0} entries
            </p>
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href={pageHref(baseHref, page - 1)}
                    className={
                      page === 0 ? "pointer-events-none opacity-50" : undefined
                    }
                    tabIndex={page === 0 ? -1 : undefined}
                    aria-disabled={page === 0}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href={pageHref(baseHref, page + 1)}
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
