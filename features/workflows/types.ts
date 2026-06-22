export type { EdgeMeta, StepMeta, StepRunStatus } from './lib/layout'

export type OrgWorkflow = {
  id: string
  display_name: string
  description: string | null
  status: string
}

export type WorkflowHubRow = {
  id: string
  workflow_key: string
  display_name: string
  description: string | null
  status: string
  department_id: string | null
  department_name: string | null
  run_count: number
  last_executed: string | null
}

export type WorkflowCanvasWorkflow = {
  id: string
  workflow_key: string
  display_name: string
  description: string | null
  status: string
  config_overrides: unknown
  created_at: string
  schedule_cron: string | null
  has_output: boolean
}

export type JsonSchemaProps = {
  type?: string
  properties?: Record<string, { type?: string; description?: string }>
  required?: string[]
}

export type WorkflowStepRunRow = {
  id: string
  step_id: string
  kind: string
  status: string
  error: { reason: string; description: string } | null
  created_at: string
}

export type WorkflowRunRow = {
  id: string
  workflow_key: string
  status: string
  trigger: string
  error: string | null
  started_by: string | null
  created_at: string
  completed_at: string | null
  users: { display_name: string | null } | null
  workflow_step_runs: WorkflowStepRunRow[]
}

export type WorkflowDetailStats = {
  total_runs: number
  successful_runs: number
  failed_runs: number
  failure_rate: number
  avg_duration_ms: number | null
  latest_run_status: string | null
  latest_run_created_at: string | null
  latest_run_completed_at: string | null
}

export type WorkflowDailyRunRow = {
  run_date: string
  successful_runs: number
  failed_runs: number
}
