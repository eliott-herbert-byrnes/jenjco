import * as ledger from "./ledger"
import { recordStepUsage } from "./usage"
import { writeStatusInStep } from "./status-stream"

export type StepLifecycleContext = {
  ledgerRunId: string
  stepId: string
  kind: ledger.StepKind
  orgId: string
  userId: string
  resourceKey: string
}

/**
 * Wraps every workflow step: ledger marks, status NDJSON, and per-step usage.
 * AI steps defer token usage to mastra-step; deterministic steps log zero tokens here.
 */
export async function withStepLifecycle<T>(
  ctx: StepLifecycleContext,
  fn: () => Promise<T>
): Promise<T> {
  const { ledgerRunId, stepId, kind, orgId, userId, resourceKey } = ctx
  const startedAt = Date.now()

  await ledger.markStep({
    ledgerRunId,
    stepId,
    kind,
    status: "running",
  })
  await writeStatusInStep({ type: "step-start", stepId })

  try {
    const result = await fn()
    const durationMs = Date.now() - startedAt

    if (kind === "deterministic") {
      await recordStepUsage({
        orgId,
        userId,
        ledgerRunId,
        stepId,
        resourceKey,
        tokensIn: 0,
        tokensOut: 0,
        durationMs,
        status: "success",
      })
    }

    await ledger.markStep({
      ledgerRunId,
      stepId,
      kind,
      status: "completed",
    })
    await writeStatusInStep({ type: "step-complete", stepId })

    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const durationMs = Date.now() - startedAt

    if (kind === "deterministic") {
      await recordStepUsage({
        orgId,
        userId,
        ledgerRunId,
        stepId,
        resourceKey,
        tokensIn: 0,
        tokensOut: 0,
        durationMs,
        status: "error",
      })
    }

    await ledger.markStep({
      ledgerRunId,
      stepId,
      kind,
      status: "failed",
    })
    await writeStatusInStep({ type: "step-failed", stepId, message })
    throw err
  }
}
