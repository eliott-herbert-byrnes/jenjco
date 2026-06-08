import { googleDriveIngestWorkflow } from "./definitions/google-drive-ingest.workflow"
import { processKnowledgeSummaryWorkflow } from "./definitions/process-knowledge-summary.workflow"

/**
 * Production workflow registry. Do not register _spike here — it is dev-only (see spike route).
 */
export const WORKFLOWS = {
  "process-knowledge-summary": processKnowledgeSummaryWorkflow,
  "google-drive-ingest": googleDriveIngestWorkflow,
} as const

export type WorkflowKey = keyof typeof WORKFLOWS

export { spikeWorkflow } from "./definitions/_spike.workflow"
export { googleDriveIngestWorkflow } from "./definitions/google-drive-ingest.workflow"
