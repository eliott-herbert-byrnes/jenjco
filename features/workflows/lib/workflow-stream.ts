export type WorkflowStatusChunk =
  | { type: "step-start"; stepId: string }
  | { type: "step-complete"; stepId: string }
  | { type: "step-failed"; stepId: string; message?: string }

export type WorkflowStreamChunk =
  | WorkflowStatusChunk
  | { type: "workflow-result"; result: unknown }
  | { type: "error"; message: string }

/** Validates status namespace chunks before forwarding to the drawer stream. */
export function mapWorkflowStreamChunk(raw: unknown): WorkflowStatusChunk | null {
  if (!raw || typeof raw !== "object") return null

  const e = raw as Record<string, unknown>
  const type = e.type

  if (type === "step-start" || type === "step-complete") {
    const stepId = e.stepId
    if (typeof stepId !== "string" || !stepId) return null
    return { type, stepId }
  }

  if (type === "step-failed") {
    const stepId = e.stepId
    if (typeof stepId !== "string" || !stepId) return null
    const message = typeof e.message === "string" ? e.message : undefined
    return { type: "step-failed", stepId, message }
  }

  return null
}

export function encodeWorkflowStreamChunk(chunk: WorkflowStreamChunk): Uint8Array {
  return new TextEncoder().encode(`${JSON.stringify(chunk)}\n`)
}
