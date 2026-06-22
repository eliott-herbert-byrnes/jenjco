import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { Header } from "@/components/header"
import { OverviewMetrics } from "@/features/analytics/components/overview-metrics"
import { WorkflowSummaryTable } from "@/features/analytics/components/workflow-summary-table"
import type {
  AnalyticsOverviewMetrics,
  WorkflowSummaryRow,
} from "@/features/analytics/types"
import { getServerAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Analytics Overview" }

export default async function AnalyticsOverviewPage() {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)
  if (appUser.role !== "admin") redirect(paths.dashboard)

  const supabase = await createClient()

  const [
    { data: metrics, error: metricsError },
    { data: workflows, error: workflowsError },
    { data: departments },
  ] = await Promise.all([
    supabase.rpc("get_analytics_overview", { p_org_id: appUser.orgId }),
    supabase.rpc("get_analytics_workflow_summary", { p_org_id: appUser.orgId }),
    supabase
      .from("departments")
      .select("id, name")
      .eq("org_id", appUser.orgId)
      .order("sort_order"),
  ])

  if (metricsError) throw new Error(metricsError.message)
  if (workflowsError) throw new Error(workflowsError.message)

  const overviewMetrics = (metrics?.[0] ?? {
    total_runs_month: 0,
    total_runs_week: 0,
    total_runs_today: 0,
    total_failures_month: 0,
    failure_rate_month: 0,
    avg_run_time_ms: null,
  }) as AnalyticsOverviewMetrics

  return (
    <>
      <Header
        page="Analytics"
        description="Workflow execution metrics and summaries"
      />
      <div className="flex flex-col gap-6 p-6">
        <OverviewMetrics metrics={overviewMetrics} />
        <WorkflowSummaryTable
          rows={(workflows ?? []) as WorkflowSummaryRow[]}
          departments={departments ?? []}
        />
      </div>
    </>
  )
}
