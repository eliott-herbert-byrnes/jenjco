import { after } from "next/server"
import { resumeHook, Run, start } from "workflow/api"

import type { Json } from "@/lib/database.types"
import { createAdminClient } from "@/lib/supabase/admin"
import { WORKFLOWS, type WorkflowKey } from "@/src/workflows/index"

import { hasRunningWorkflow } from "./idempotency"
import * as ledger from "./ledger"
import {
  recordWorkflowRollup,
  sumStepUsageForRun,
} from "./usage"

export type TriggerKind = "manual" | "cron" | "event"

export type StartWorkflowRunParams = {
  orgId: string
  workflowKey: WorkflowKey
  trigger: TriggerKind
  startedByUserId?: string | null
  orgWorkflowId?: string
}

export type StartWorkflowRunResult =
  | {
      ledgerRunId: string
      vercelRunId: string
      departmentId: string | null
      run: Run<unknown>
    }
  | {
      skipped: true
      reason: string
    }

export type FinalizeWorkflowRunParams = {
  run: Run<unknown>
  ledgerRunId: string
  orgId: string
  workflowKey: string
  startedByUserId: string | null
  departmentId: string | null
  startedAt: number
}

function isWorkflowKey(key: string): key is WorkflowKey {
  return key in WORKFLOWS
}

async function resolveDepartmentId(
  orgId: string,
  workflowKey: string,
  orgWorkflowId?: string
): Promise<string | null> {
  const supabase = createAdminClient()

  if (orgWorkflowId) {
    const { data, error } = await supabase
      .from("org_workflows")
      .select("department_id")
      .eq("id", orgWorkflowId)
      .eq("org_id", orgId)
      .maybeSingle()

    if (error) throw error
    return data?.department_id ?? null
  }

  const { data, error } = await supabase
    .from("org_workflows")
    .select("department_id")
    .eq("org_id", orgId)
    .eq("workflow_key", workflowKey)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data?.department_id ?? null
}

function buildWorkflowInput(
  workflowKey: WorkflowKey,
  params: {
    orgId: string
    ledgerRunId: string
    startedByUserId: string | null
    departmentId: string | null
    trigger: TriggerKind
  }
) {
  const base = {
    orgId: params.orgId,
    ledgerRunId: params.ledgerRunId,
    startedByUserId: params.startedByUserId,
    departmentId: params.departmentId,
  }

  if (workflowKey === "google-drive-ingest" && params.trigger !== "manual") {
    return { ...base, trigger: params.trigger }
  }

  return base
}

export async function startWorkflowRun(
  params: StartWorkflowRunParams
): Promise<StartWorkflowRunResult> {
  const { orgId, workflowKey, trigger, startedByUserId = null, orgWorkflowId } =
    params

  if (!isWorkflowKey(workflowKey)) {
    throw new Error(`Workflow not registered: ${workflowKey}`)
  }

  const alreadyRunning = await hasRunningWorkflow(orgId, workflowKey)
  if (alreadyRunning) {
    return { skipped: true, reason: "already_running" }
  }

  const departmentId = await resolveDepartmentId(
    orgId,
    workflowKey,
    orgWorkflowId
  )

  const ledgerRunId = crypto.randomUUID()
  const workflowInput = buildWorkflowInput(workflowKey, {
    orgId,
    ledgerRunId,
    startedByUserId: startedByUserId ?? null,
    departmentId,
    trigger,
  })

  const run =
    workflowKey === "google-drive-ingest"
      ? await start(WORKFLOWS["google-drive-ingest"], [workflowInput])
      : await start(WORKFLOWS["process-knowledge-summary"], [workflowInput])

  await ledger.createRun({
    id: ledgerRunId,
    orgId,
    workflowKey,
    vercelRunId: run.runId,
    startedBy: startedByUserId ?? null,
    trigger,
    input: workflowInput as Json,
  })

  return {
    ledgerRunId,
    vercelRunId: run.runId,
    departmentId,
    run,
  }
}

export async function finalizeWorkflowRun({
  run,
  ledgerRunId,
  orgId,
  workflowKey,
  startedByUserId,
  departmentId,
  startedAt,
}: FinalizeWorkflowRunParams): Promise<void> {
  try {
    const result = await run.returnValue
    const { tokensIn, tokensOut } = await sumStepUsageForRun(ledgerRunId)

    await ledger.completeRun({
      ledgerRunId,
      output: result as Json,
      tokensIn,
      tokensOut,
    })
    await recordWorkflowRollup({
      orgId,
      userId: startedByUserId,
      ledgerRunId,
      workflowKey,
      departmentId,
      tokensIn,
      tokensOut,
      durationMs: Date.now() - startedAt,
      status: "success",
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    let tokensIn = 0
    let tokensOut = 0
    try {
      const totals = await sumStepUsageForRun(ledgerRunId)
      tokensIn = totals.tokensIn
      tokensOut = totals.tokensOut
    } catch {
      // Best-effort token roll-up on failure.
    }

    await ledger.failRun({ ledgerRunId, error: message })
    await recordWorkflowRollup({
      orgId,
      userId: startedByUserId,
      ledgerRunId,
      workflowKey,
      departmentId,
      tokensIn,
      tokensOut,
      durationMs: Date.now() - startedAt,
      status: "error",
    })
  }
}

export function scheduleFinalize(params: FinalizeWorkflowRunParams): void {
  after(() => finalizeWorkflowRun(params))
}

export async function resumeHookForRun<T>(
  token: string,
  data: T
): Promise<void> {
  await resumeHook(token, data)
}
