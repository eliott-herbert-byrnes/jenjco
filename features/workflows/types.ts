export type { EdgeMeta, StepMeta, StepRunStatus } from './lib/layout'

export type OrgWorkflow = {
  id: string
  display_name: string
  description: string | null
  is_active: boolean
}

export type WorkflowCanvasWorkflow = {
  id: string
  workflow_key: string
  display_name: string
  description: string | null
  is_active: boolean
  config_overrides: unknown
  created_at: string
}

export type JsonSchemaProps = {
  type?: string
  properties?: Record<string, { type?: string; description?: string }>
  required?: string[]
}
