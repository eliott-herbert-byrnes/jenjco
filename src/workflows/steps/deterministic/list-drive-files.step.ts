import { proxyRequest } from "@/lib/integrations/proxy-request"
import { withSpikeStepLifecycle } from "@/src/workflows/runtime/spike-step-lifecycle"

type ListDriveFilesInput = {
  orgId: string
}

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

export async function listDriveFilesStep(
  input: ListDriveFilesInput
): Promise<ListDriveFilesOutput> {
  "use step"

  return withSpikeStepLifecycle("list-drive-files", async () => {
    const data = await proxyRequest<DriveFilesResponse>(
      input.orgId,
      "google-drive",
      {
        method: "GET",
        endpoint: "/drive/v3/files",
        params: { pageSize: 5, fields: "files(id,name)" },
        triggerType: "workflow_step",
        resourceKey: "google-drive-ingest",
      }
    )

    const files = data.files ?? []

    return {
      fileCount: files.length,
      names: files.map((file) => file.name),
    }
  })
}
