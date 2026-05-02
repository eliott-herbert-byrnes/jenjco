import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TokenUsageChart } from "@/features/audit/components/token-usage-chart"
import { getServerAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardHomePage() {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)

  const supabase = await createClient()
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: agentCount },
    { count: workflowCount },
    { count: processCount },
    { data: usageRows },
  ] = await Promise.all([
    supabase
      .from("org_agents")
      .select("*", { count: "exact", head: true })
      .eq("org_id", appUser.orgId)
      .eq("is_active", true),
    supabase
      .from("org_workflows")
      .select("*", { count: "exact", head: true })
      .eq("org_id", appUser.orgId)
      .eq("is_active", true),
    supabase
      .from("org_processes")
      .select("*", { count: "exact", head: true })
      .eq("org_id", appUser.orgId),
    supabase
      .from("usage_logs")
      .select("created_at, tokens_in, tokens_out")
      .eq("org_id", appUser.orgId)
      .gte("created_at", since)
      .order("created_at", { ascending: true }),
  ])

  const dailyMap: Record<string, number> = {}
  for (const r of usageRows ?? []) {
    const day = r.created_at.slice(0, 10)
    dailyMap[day] =
      (dailyMap[day] ?? 0) + (r.tokens_in ?? 0) + (r.tokens_out ?? 0)
  }
  const dailyUsage = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, tokens]) => ({ date, tokens }))

  const summary = [
    { label: "Active Agents", value: agentCount ?? 0 },
    { label: "Active Workflows", value: workflowCount ?? 0 },
    { label: "Processes", value: processCount ?? 0 },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      <section className="grid gap-4 sm:grid-cols-3">
        {summary.map((item) => (
          <Card key={item.label} size="sm">
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">{item.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Token usage (30 days)</CardTitle>
          <CardDescription>
            Daily totals · cost estimates are approximate (GPT-4o rates)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TokenUsageChart data={dailyUsage} />
        </CardContent>
      </Card>
    </div>
  )
}
