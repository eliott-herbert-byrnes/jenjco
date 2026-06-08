import { listDriveFilesStep } from "@/src/workflows/steps/deterministic/list-drive-files.step"

/** Dev-only workflow — not registered in WORKFLOWS (see /api/dev/drive-ingest). */
export async function googleDriveIngestWorkflow(input: { orgId: string }) {
  "use workflow"
  return listDriveFilesStep(input)
}
