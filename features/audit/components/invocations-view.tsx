import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000
const sinceCutoffMs = Date.now() - WINDOW_MS

export async function InvocationsView({
  tab,
  orgId,
}: {
  tab: "agents" | "workflows"
  orgId: string
}) {
  const supabase = await createClient()
  const since = new Date(sinceCutoffMs).toISOString()
  // Roll-ups only — workflow tab counts resource_type = 'workflow', not workflow_step.
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

  const keys = [
    ...new Set(rows.map((r) => r.resource_key).filter((k): k is string => k != null)),
  ]

  const nameMap =
    tab === "agents"
      ? Object.fromEntries(
          (
            (
              await supabase
                .from("org_agents")
                .select("agent_key, display_name")
                .eq("org_id", orgId)
                .in("agent_key", keys.length ? keys : [""])
            ).data ?? []
          ).map((r) => [r.agent_key, r.display_name])
        )
      : Object.fromEntries(
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
      </CardContent>
    </Card>
  )
}
