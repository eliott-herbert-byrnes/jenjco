export type AnalyticsOverviewMetrics = {
  total_runs_month: number
  total_runs_week: number
  total_runs_today: number
  total_failures_month: number
  failure_rate_month: number
  avg_run_time_ms: number | null
}

export type WorkflowSummaryRow = {
  workflow_key: string
  display_name: string
  department_id: string | null
  department_name: string | null
  total_runs: number
  failed_runs: number
  last_run_at: string | null
  avg_duration_ms: number | null
}

export type WorkflowStepStatsRow = {
  step_id: string
  kind: string
  total_executions: number
  failed_executions: number
  latest_status: string
  latest_error: { reason: string; description: string } | null
  last_executed_at: string
}
