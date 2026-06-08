import { createTool } from "@mastra/core/tools"
import { z } from "zod"
import { ConnectionError } from "@/lib/integrations/errors"
import { proxyRequest } from "@/lib/integrations/proxy-request"

const googleDriveSearchRequestContextSchema = z.object({
  orgId: z.string().uuid().optional(),
})

type DriveFile = {
  id: string
  name: string
  mimeType?: string
  modifiedTime?: string
}

type DriveFilesResponse = {
  files?: DriveFile[]
}

function escapeDriveQuery(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'")
}

export const googleDriveSearchTool = createTool({
  id: "google-drive-search",
  description:
    "Search the organization's connected Google Drive for files. Use when the user asks about files, folders, or Drive content. Return a list of discovered files. If no files found, simply tell the user that you are unable to locate any files. Do not make up files that do not exist.",
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe("Optional text to filter files by name"),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        mimeType: z.string().optional(),
        modifiedTime: z.string().optional(),
      })
    ),
    error: z.enum(["not_connected", "reconnect_required"]).optional(),
  }),
  requestContextSchema: googleDriveSearchRequestContextSchema,
  execute: async ({ query }, context) => {
    const orgIdFromContext = context?.requestContext?.get("orgId")
    const orgId =
      orgIdFromContext ?? process.env.MASTRA_STUDIO_ORG_ID?.trim() ?? undefined
    if (!orgId) {
      throw new Error(
        "orgId missing: set RequestContext in the app, or MASTRA_STUDIO_ORG_ID in .env for Mastra Studio (seed org UUID)."
      )
    }

    try {
      const params: Record<string, string | number> = {
        pageSize: 10,
        fields: "files(id,name,mimeType,modifiedTime)",
      }

      const trimmedQuery = query?.trim()
      if (trimmedQuery) {
        params.q = `name contains '${escapeDriveQuery(trimmedQuery)}' and trashed = false`
      } else {
        params.q = "trashed = false"
      }

      const data = await proxyRequest<DriveFilesResponse>(orgId, "google-drive", {
        method: "GET",
        endpoint: "/drive/v3/files",
        params,
        triggerType: "agent",
        resourceKey: "google-drive-search",
      })

      return {
        results: (data.files ?? []).map((file) => ({
          id: file.id,
          name: file.name,
          mimeType: file.mimeType,
          modifiedTime: file.modifiedTime,
        })),
      }
    } catch (err) {
      if (err instanceof ConnectionError) {
        const error =
          err.connectionStatus === "reconnect_required"
            ? ("reconnect_required" as const)
            : ("not_connected" as const)
        return { results: [], error }
      }
      throw err
    }
  },
})
