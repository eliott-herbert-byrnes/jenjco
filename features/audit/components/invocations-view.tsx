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
import { createClient } from "@/lib/supabase/server"

const PAGE_SIZE = 20

function pageHref(base: string, p: number) {
  return `${base}&page=${p}`
}

export async function InvocationsView({
  orgId,
  page = 0,
}: {
  orgId: string
  page?: number
}) {
  const supabase = await createClient()

  const { data: rows, count } = await supabase
    .from("usage_logs")
    .select(
      "id, resource_key, resource_type, tokens_in, tokens_out, duration_ms, status, created_at",
      { count: "exact" }
    )
    .eq("org_id", orgId)
    .eq("resource_type", "workflow")
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))
  const baseHref = `${paths.audit}?tab=workflows`

  if (!rows?.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No workflow invocations found
      </p>
    )
  }

  const keys = [
    ...new Set(rows.map((r) => r.resource_key).filter((k): k is string => k != null)),
  ]

  const nameMap = Object.fromEntries(
    (
      (
        await supabase
          .from("org_workflows")
          .select("workflow_key, display_name")
          .eq("org_id", orgId)
          .in("workflow_key", keys.length ? keys : [""])
      ).data ?? []
    ).map((r) => [r.workflow_key, r.display_name])
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Invocations</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              {["Resource", "Status", "Tokens in", "Tokens out", "Duration", "Time"].map(
                (h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-left font-medium text-muted-foreground"
                  >
                    {h}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b last:border-0 hover:bg-muted/30"
              >
                <td className="px-4 py-2 font-medium">
                  {nameMap[r.resource_key ?? ""] ?? r.resource_key}
                </td>
                <td className="px-4 py-2">
                  <Badge
                    variant={
                      r.status === "success" ? "default" : "destructive"
                    }
                  >
                    {r.status}
                  </Badge>
                </td>
                <td className="px-4 py-2 tabular-nums">
                  {(r.tokens_in ?? 0).toLocaleString()}
                </td>
                <td className="px-4 py-2 tabular-nums">
                  {(r.tokens_out ?? 0).toLocaleString()}
                </td>
                <td className="px-4 py-2 tabular-nums">
                  {r.duration_ms != null ? `${r.duration_ms}ms` : "—"}
                </td>
                <td className="px-4 py-2 text-muted-foreground">
                  {new Date(r.created_at as string).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {totalPages > 1 ? (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-xs text-muted-foreground">
              Page {page + 1} of {totalPages} · {count ?? 0} invocations
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
