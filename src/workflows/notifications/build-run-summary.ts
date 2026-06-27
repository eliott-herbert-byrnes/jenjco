import type { Json } from "@/lib/database.types"
import { createAdminClient } from "@/lib/supabase/admin"

const ERROR_MAX_LENGTH = 200
const SENSITIVE_PATTERN =
  /auth|token|api[_-]?key|secret|password|credential|bearer/i

export type WorkflowRunStepSummary = {
  step_id: string
  kind: string
  status: string
  error: string | null
}

export type WorkflowRunSummary = {
  workflowName: string
  eventType: "completion" | "error"
  timestamp: string
  trigger: string
  durationMs: number | null
  runError: string | null
  steps: WorkflowRunStepSummary[]
}

export function sanitizeErrorMessage(message: string): string {
  const trimmed = message.trim()
  if (!trimmed) return trimmed

  if (SENSITIVE_PATTERN.test(trimmed)) {
    return "Integration error"
  }

  if (trimmed.length <= ERROR_MAX_LENGTH) {
    return trimmed
  }

  return `${trimmed.slice(0, ERROR_MAX_LENGTH)}…`
}

function parseStepError(error: Json | null): string | null {
  if (!error || typeof error !== "object" || Array.isArray(error)) {
    return null
  }

  const record = error as Record<string, unknown>
  const reason = typeof record.reason === "string" ? record.reason : ""
  const description =
    typeof record.description === "string" ? record.description : ""

  const combined = [reason, description].filter(Boolean).join(": ")
  if (!combined) return null

  return sanitizeErrorMessage(combined)
}

export async function buildRunSummary(input: {
  orgWorkflowId: string
  ledgerRunId: string
  eventType: "completion" | "error"
}): Promise<WorkflowRunSummary | null> {
  const supabase = createAdminClient()

  const { data: workflow, error: workflowError } = await supabase
    .from("org_workflows")
    .select("display_name")
    .eq("id", input.orgWorkflowId)
    .maybeSingle()

  if (workflowError || !workflow) {
    return null
  }

  const { data: run, error: runError } = await supabase
    .from("workflow_runs")
    .select(
      "created_at, completed_at, trigger, status, error, workflow_step_runs(step_id, kind, status, error)"
    )
    .eq("id", input.ledgerRunId)
    .maybeSingle()

  if (runError || !run) {
    return null
  }

  const completedAt = run.completed_at
  const createdAt = run.created_at
  const durationMs =
    completedAt && createdAt
      ? new Date(completedAt).getTime() - new Date(createdAt).getTime()
      : null

  const steps = (run.workflow_step_runs ?? []).map((step) => ({
    step_id: step.step_id,
    kind: step.kind,
    status: step.status,
    error: parseStepError(step.error),
  }))

  return {
    workflowName: workflow.display_name,
    eventType: input.eventType,
    timestamp: completedAt ?? createdAt,
    trigger: run.trigger,
    durationMs,
    runError:
      run.error ? sanitizeErrorMessage(run.error) : null,
    steps,
  }
}
