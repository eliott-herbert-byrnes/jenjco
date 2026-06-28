import { OverviewMetrics } from "@/features/analytics/components/overview-metrics"
import type { AnalyticsOverviewMetrics } from "@/features/analytics/types"
import { createClient } from "@/lib/supabase/server"

type OverviewMetricsSectionProps = {
  orgId: string
}

export async function OverviewMetricsSection({
  orgId,
}: OverviewMetricsSectionProps) {
  const supabase = await createClient()
  const { data: metrics, error: metricsError } = await supabase.rpc(
    "get_analytics_overview",
    { p_org_id: orgId }
  )

  if (metricsError) throw new Error(metricsError.message)

  const overviewMetrics = (metrics?.[0] ?? {
    total_runs_month: 0,
    total_runs_week: 0,
    total_runs_today: 0,
    total_failures_month: 0,
    failure_rate_month: 0,
    avg_run_time_ms: null,
  }) as AnalyticsOverviewMetrics

  return <OverviewMetrics metrics={overviewMetrics} />
}
