import { getWritable } from "workflow"

export const STATUS_STREAM_NAMESPACE = "status"

export type StatusStreamEvent =
  | { type: "step-start"; stepId: string }
  | { type: "step-complete"; stepId: string }
  | { type: "step-failed"; stepId: string; message?: string }

/** Write from inside an existing step (no nested step boundary). */
export async function writeStatusInStep(event: StatusStreamEvent) {
  const writer = getWritable<StatusStreamEvent>({
    namespace: STATUS_STREAM_NAMESPACE,
  }).getWriter()
  try {
    await writer.write(event)
  } finally {
    writer.releaseLock()
  }
}

export async function emitStepStart(stepId: string) {
  "use step"
  await writeStatusInStep({ type: "step-start", stepId })
}

export async function emitStepComplete(stepId: string) {
  "use step"
  await writeStatusInStep({ type: "step-complete", stepId })
}

export async function emitStepFailed(stepId: string, message?: string) {
  "use step"
  await writeStatusInStep({ type: "step-failed", stepId, message })
}
