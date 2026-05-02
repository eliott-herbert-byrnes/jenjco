import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

export async function InvocationsView({
  tab,
  orgId,
}: {
  tab: "agents" | "workflows"
  orgId: string
}) {
  const supabase = await createClient()
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const resourceType = tab === "agents" ? "agent" : "workflow"

  const { data: rows } = await supabase
    .from("usage_logs")
    .select(
      "id, resource_key, resource_type, tokens_in, tokens_out, duration_ms, status, created_at"
    )
    .eq("org_id", orgId)
    .eq("resource_type", resourceType)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(50)

  if (!rows?.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No invocations in the last 30 days
      </p>
    )
  }

  const keys = [...new Set(rows.map((r) => r.resource_key))]
  const nameTable = tab === "agents" ? "org_agents" : "org_workflows"
  const keyCol = tab === "agents" ? "agent_key" : "workflow_key"

  const { data: nameRows } = await supabase
    .from(nameTable)
    .select(`${keyCol}, display_name`)
    .eq("org_id", orgId)
    .in(keyCol, keys)

  const nameMap = Object.fromEntries(
    (nameRows ?? []).map((r) => {
      const row = r as Record<string, string>
      return [row[keyCol] as string, row.display_name as string]
    })
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
      </CardContent>
    </Card>
  )
}
