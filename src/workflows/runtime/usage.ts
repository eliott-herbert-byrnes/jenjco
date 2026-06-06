import { createAdminClient } from "@/lib/supabase/admin"

// Cost rates mirror lib/usage-logger.ts (GPT-4o approximations).
const COST_PER_INPUT = 0.00015 / 1000
const COST_PER_OUTPUT = 0.0006 / 1000

function estimateCost(tokensIn: number, tokensOut: number): number {
  return tokensIn * COST_PER_INPUT + tokensOut * COST_PER_OUTPUT
}

export async function recordStepUsage({
  orgId,
  userId,
  ledgerRunId,
  stepId,
  resourceKey,
  tokensIn,
  tokensOut,
  durationMs,
  status = "success",
}: {
  orgId: string
  userId: string
  ledgerRunId: string
  stepId: string
  resourceKey: string
  tokensIn: number
  tokensOut: number
  durationMs?: number
  status?: "success" | "error"
}): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from("usage_logs").insert({
    org_id: orgId,
    user_id: userId,
    resource_key: resourceKey,
    resource_type: "workflow_step",
    run_id: ledgerRunId,
    step_id: stepId,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    cost_estimate: estimateCost(tokensIn, tokensOut),
    duration_ms: durationMs ?? null,
    status,
  })

  if (error) throw error
}

export async function sumStepUsageForRun(ledgerRunId: string): Promise<{
  tokensIn: number
  tokensOut: number
}> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("usage_logs")
    .select("tokens_in, tokens_out")
    .eq("run_id", ledgerRunId)
    .eq("resource_type", "workflow_step")

  if (error) throw error

  return (data ?? []).reduce(
    (acc, row) => ({
      tokensIn: acc.tokensIn + (row.tokens_in ?? 0),
      tokensOut: acc.tokensOut + (row.tokens_out ?? 0),
    }),
    { tokensIn: 0, tokensOut: 0 }
  )
}

export async function recordWorkflowRollup({
  orgId,
  userId,
  ledgerRunId,
  workflowKey,
  tokensIn,
  tokensOut,
  durationMs,
  status = "success",
}: {
  orgId: string
  userId: string
  ledgerRunId: string
  workflowKey: string
  tokensIn: number
  tokensOut: number
  durationMs?: number
  status?: "success" | "error"
}): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from("usage_logs").insert({
    org_id: orgId,
    user_id: userId,
    resource_key: workflowKey,
    resource_type: "workflow",
    run_id: ledgerRunId,
    step_id: null,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    cost_estimate: estimateCost(tokensIn, tokensOut),
    duration_ms: durationMs ?? null,
    status,
  })

  if (error) throw error
}
