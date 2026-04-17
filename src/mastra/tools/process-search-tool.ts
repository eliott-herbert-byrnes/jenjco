import { createTool } from "@mastra/core/tools"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"
import { generateEmbedding } from "@/lib/embeddings"

const processSearchRequestContextSchema = z.object({
  orgId: z.string().uuid().optional(),
})

export const processSearchTool = createTool({
  id: "process-search",
  description:
    "Search internal business processes by semantic similarity. Use this when the user asks about a process, procedure, or how to do something.",
  inputSchema: z.object({
    query: z.string().describe("The user question or search phrase"),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        title: z.string(),
        content: z.string(),
        similarity: z.number(),
      })
    ),
  }),
  requestContextSchema: processSearchRequestContextSchema,
  execute: async ({ query }, context) => {
    const orgIdFromContext = context?.requestContext?.get("orgId")
    // Mastra Studio does not inject app auth; use same org UUID as seed/demo for local testing.
    const orgId =
      orgIdFromContext ?? process.env.MASTRA_STUDIO_ORG_ID?.trim() ?? undefined
    // #region agent log
    fetch("http://127.0.0.1:7863/ingest/8e054a94-5c3a-4d12-a295-844d6b6a346c", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "a61970",
      },
      body: JSON.stringify({
        sessionId: "a61970",
        location: "src/mastra/tools/process-search-tool.ts:execute",
        message: "processSearch org resolution",
        data: {
          hypothesisId: "D",
          hasContextOrg: !!orgIdFromContext,
          hasEnvOrg: !!process.env.MASTRA_STUDIO_ORG_ID?.trim(),
          resolved: !!orgId,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {})
    // #endregion
    if (!orgId) {
      throw new Error(
        "orgId missing: set RequestContext in the app, or MASTRA_STUDIO_ORG_ID in .env for Mastra Studio (seed org UUID)."
      )
    }

    const embedding = await generateEmbedding(query)
    const supabase = createAdminClient()

    const { data, error } = await supabase.rpc("search_processes", {
      query_embedding: embedding,
      org_id_filter: orgId,
      match_count: 5,
    })
    if (error) throw error

    return { results: data ?? [] }
  },
})
