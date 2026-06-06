import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"

import { TokenUsageChart } from "./token-usage-chart"

const WINDOW_MS = 30 * 24 * 60 * 60 * 1000
const dateNow = Date.now() - WINDOW_MS

export async function MetricsView({
  tab,
  orgId,
}: {
  tab: "agents" | "workflows"
  orgId: string
}) {
  const supabase = await createClient()
  const since = new Date(dateNow).toISOString()
  // Roll-ups only — never include workflow_step detail rows in charts/totals.
  const resourceType = tab === "agents" ? "agent" : "workflow"

  const [{ count: totalConversations }, { data: rows }] = await Promise.all([
    supabase
      .from("conversations")
      .select("*", { count: "exact", head: true })
      .eq("org_id", orgId),
    supabase
      .from("usage_logs")
      .select(
        "resource_key, resource_type, tokens_in, tokens_out, cost_estimate, created_at"
      )
      .eq("org_id", orgId)
      .eq("resource_type", resourceType)
      .eq("status", "success")
      .gte("created_at", since)
      .order("created_at", { ascending: true }),
  ])

  const allRows = rows ?? []
  const totalTokens = allRows.reduce(
    (s, r) => s + (r.tokens_in ?? 0) + (r.tokens_out ?? 0),
    0
  )
  const totalCost = allRows.reduce(
    (s, r) => s + Number(r.cost_estimate ?? 0),
    0
  )
  const totalInvocations = allRows.length

  const dailyMap: Record<string, number> = {}
  for (const r of allRows) {
    const day = (r.created_at as string).slice(0, 10)
    dailyMap[day] =
      (dailyMap[day] ?? 0) + (r.tokens_in ?? 0) + (r.tokens_out ?? 0)
  }
  const dailyUsage = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, tokens]) => ({ date, tokens }))

  const summaryCards = [
    { label: "Conversations", value: (totalConversations ?? 0).toLocaleString() },
    { label: "Invocations (30d)", value: totalInvocations.toLocaleString() },
    { label: "Tokens (30d)", value: totalTokens.toLocaleString() },
    { label: "Est. Cost (30d)", value: `~$${totalCost.toFixed(4)}` },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((c) => (
          <Card key={c.label} size="sm">
            <CardHeader className="pb-2">
              <CardDescription>{c.label}</CardDescription>
              <CardTitle className="text-2xl tabular-nums">{c.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Token usage (30 days)</CardTitle>
          <CardDescription>
            Daily tokens · cost estimates are approximate (GPT-4o rates)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TokenUsageChart data={dailyUsage} />
        </CardContent>
      </Card>
    </div>
  )
}
