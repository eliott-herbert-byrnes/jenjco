/** Injected by the run route only — not exposed in canvas inputSchema. */
export type WorkflowRunInput = {
  orgId: string
  ledgerRunId: string
  startedByUserId: string
}

export const WORKFLOW_KEY_PROCESS_KNOWLEDGE_SUMMARY =
  "process-knowledge-summary" as const
