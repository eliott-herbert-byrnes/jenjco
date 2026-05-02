import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

const PAGE_SIZE = 50

export async function LogsView({
  orgId,
  page = 0,
}: {
  orgId: string
  page?: number
}) {
  const supabase = await createClient()
  const { data, count } = await supabase
    .from("usage_logs")
    .select(
      "id, resource_key, resource_type, tokens_in, tokens_out, cost_estimate, duration_ms, status, created_at",
      { count: "exact" }
    )
    .eq("org_id", orgId)
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

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
        <p className="px-4 py-3 text-xs text-muted-foreground">
          Showing {data.length} of {count ?? "?"} entries
        </p>
      </CardContent>
    </Card>
  )
}
