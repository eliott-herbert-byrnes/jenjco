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
import { getProvider } from "@/lib/integrations/providers"
import { createClient } from "@/lib/supabase/server"

const PAGE_SIZE = 20

function pageHref(base: string, p: number) {
  return `${base}&page=${p}`
}

export async function IntegrationsInvocationsView({
  orgId,
  page = 0,
}: {
  orgId: string
  page?: number
}) {
  const supabase = await createClient()

  const { data: rows, count } = await supabase
    .from("integration_invocations")
    .select(
      "id, provider, endpoint, method, status, duration_ms, error_code, created_at",
      { count: "exact" }
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE))
  const baseHref = `${paths.audit}?tab=integrations`

  if (!rows?.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No integration invocations found
      </p>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Integration Invocations</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/50">
            <tr>
              {[
                "Provider",
                "Endpoint",
                "Status",
                "Duration",
                "Error",
                "Time",
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
            {rows.map((r) => {
              const endpoint =
                r.method && r.endpoint
                  ? `${r.method} ${r.endpoint}`
                  : (r.endpoint ?? "—")

              return (
                <tr
                  key={r.id}
                  className="border-b last:border-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-2 font-medium">
                    {getProvider(r.provider)?.label ?? r.provider}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs">{endpoint}</td>
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
                    {r.duration_ms != null ? `${r.duration_ms}ms` : "—"}
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-muted-foreground">
                    {r.error_code ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {new Date(r.created_at as string).toLocaleString()}
                  </td>
                </tr>
              )
            })}
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
