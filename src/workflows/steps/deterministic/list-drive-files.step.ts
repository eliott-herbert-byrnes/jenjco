import { proxyRequest } from "@/lib/integrations/proxy-request"
import type { InvocationTriggerType } from "@/lib/integrations/log-invocation"
import type { DriveIngestInput } from "@/src/workflows/definitions/google-drive-ingest.workflow"
import { withStepLifecycle } from "@/src/workflows/runtime/with-step-lifecycle"

const WORKFLOW_KEY_GOOGLE_DRIVE_INGEST = "google-drive-ingest" as const

type DriveFile = {
  id: string
  name: string
}

type DriveFilesResponse = {
  files?: DriveFile[]
}

export type ListDriveFilesOutput = {
  fileCount: number
  names: string[]
}

function invocationTriggerType(
  trigger: DriveIngestInput["trigger"]
): InvocationTriggerType {
  if (trigger === "cron") return "cron"
  if (trigger === "event") return "event"
  return "workflow_step"
}

export async function listDriveFilesStep(
  input: DriveIngestInput
): Promise<ListDriveFilesOutput> {
  "use step"

  return withStepLifecycle(
    {
      ledgerRunId: input.ledgerRunId,
      stepId: "list-drive-files",
      kind: "deterministic",
      orgId: input.orgId,
      userId: input.startedByUserId,
      resourceKey: WORKFLOW_KEY_GOOGLE_DRIVE_INGEST,
    },
    async () => {
      const data = await proxyRequest<DriveFilesResponse>(
        input.orgId,
        "google-drive",
        {
          method: "GET",
          endpoint: "/drive/v3/files",
          params: { pageSize: 5, fields: "files(id,name)" },
          triggerType: invocationTriggerType(input.trigger),
          resourceKey: WORKFLOW_KEY_GOOGLE_DRIVE_INGEST,
          userId: input.startedByUserId,
        }
      )

      const files = data.files ?? []

      return {
        fileCount: files.length,
        names: files.map((file) => file.name),
      }
    }
  )
}
