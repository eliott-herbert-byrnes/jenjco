/**
 * ledgerRunId = workflow_runs.id; vercelRunId is never an FK.
 *
 * Routes pre-generate ledgerRunId (crypto.randomUUID()) so steps receive it from
 * the first moment of execution, then call createRun({ id: ledgerRunId, vercelRunId }).
 */

import { createAdminClient } from "@/lib/supabase/admin"
import type { Json } from "@/lib/database.types"

export type WorkflowRunTrigger = "manual" | "cron" | "event"
export type StepKind = "deterministic" | "ai"
export type StepStatus = "running" | "completed" | "failed"

export async function createRun({
  id,
  orgId,
  workflowKey,
  vercelRunId,
  startedBy,
  trigger = "manual",
  input,
}: {
  id?: string
  orgId: string
  workflowKey: string
  vercelRunId: string
  startedBy?: string | null
  trigger?: WorkflowRunTrigger
  input?: Json | null
}): Promise<string> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("workflow_runs")
    .insert({
      ...(id ? { id } : {}),
      org_id: orgId,
      workflow_key: workflowKey,
      vercel_run_id: vercelRunId,
      started_by: startedBy ?? null,
      trigger,
      input: input ?? null,
      status: "running",
    })
    .select("id")
    .single()

  if (error) throw error
  return data.id
}

export type StepError = { reason: string; description: string }

export async function markStep({
  ledgerRunId,
  stepId,
  kind,
  status,
  tokensIn = 0,
  tokensOut = 0,
  error: stepError,
}: {
  ledgerRunId: string
  stepId: string
  kind: StepKind
  status: StepStatus
  tokensIn?: number
  tokensOut?: number
  error?: StepError | null
}): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from("workflow_step_runs").upsert(
    {
      run_id: ledgerRunId,
      step_id: stepId,
      kind,
      status,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      ...(stepError != null ? { error: stepError as Json } : {}),
    },
    { onConflict: "run_id,step_id" }
  )

  if (error) throw error
}

export async function completeRun({
  ledgerRunId,
  output,
  tokensIn,
  tokensOut,
}: {
  ledgerRunId: string
  output: Json
  tokensIn: number
  tokensOut: number
}): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("workflow_runs")
    .update({
      status: "completed",
      output,
      tokens_in: tokensIn,
      tokens_out: tokensOut,
      completed_at: new Date().toISOString(),
    })
    .eq("id", ledgerRunId)

  if (error) throw error
}

export async function failRun({
  ledgerRunId,
  error: errorMessage,
}: {
  ledgerRunId: string
  error: string
}): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("workflow_runs")
    .update({
      status: "failed",
      error: errorMessage,
      completed_at: new Date().toISOString(),
    })
    .eq("id", ledgerRunId)

  if (error) throw error
}
