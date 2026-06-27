import { listDriveFilesStep } from "@/src/workflows/steps/deterministic/list-drive-files.step"
import type { WorkflowRunInput } from "@/src/workflows/types"

export type DriveIngestInput = WorkflowRunInput & {
  /** Passed through to integration invocation logs (defaults to workflow_step). */
  trigger?: "manual" | "cron" | "event"
}

export async function googleDriveIngestWorkflow(input: DriveIngestInput) {
  "use workflow"
  return listDriveFilesStep(input)
}
