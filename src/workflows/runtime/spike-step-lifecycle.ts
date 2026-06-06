import {
  writeStatusInStep,
  type StatusStreamEvent,
} from "./status-stream"

/**
 * Minimal step wrapper for the 3.0b spike — status streaming only (no ledger/usage).
 * Replaced by withStepLifecycle in 3.2.
 */
export async function withSpikeStepLifecycle<T>(
  stepId: string,
  fn: () => Promise<T>
): Promise<T> {
  await writeStatusInStep({ type: "step-start", stepId })
  try {
    const result = await fn()
    await writeStatusInStep({ type: "step-complete", stepId })
    return result
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    const failed: StatusStreamEvent = {
      type: "step-failed",
      stepId,
      message,
    }
    await writeStatusInStep(failed)
    throw err
  }
}
