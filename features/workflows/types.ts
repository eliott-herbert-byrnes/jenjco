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
