import { listDriveFilesStep } from "@/src/workflows/steps/deterministic/list-drive-files.step"

export type DriveIngestInput = {
  orgId: string
  ledgerRunId: string
  startedByUserId: string | null
  /** Passed through to integration invocation logs (defaults to workflow_step). */
  trigger?: "manual" | "cron" | "event"
}

export async function googleDriveIngestWorkflow(input: DriveIngestInput) {
  "use workflow"
  return listDriveFilesStep(input)
}
