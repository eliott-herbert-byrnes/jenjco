import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getProvider } from "@/lib/integrations/providers"
import { createClient } from "@/lib/supabase/server"

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000
const sinceCutoffMs = Date.now() - WINDOW_MS

export async function IntegrationsInvocationsView({ orgId }: { orgId: string }) {
  const supabase = await createClient()
  const since = new Date(sinceCutoffMs).toISOString()

  const { data: rows } = await supabase
    .from("integration_invocations")
    .select(
      "id, provider, endpoint, method, status, duration_ms, error_code, created_at"
    )
    .eq("org_id", orgId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50)

  if (!rows?.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No integration invocations in the last 30 days
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
      </CardContent>
    </Card>
  )
}
