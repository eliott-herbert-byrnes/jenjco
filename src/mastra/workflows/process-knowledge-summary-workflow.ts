import { createStep, createWorkflow } from "@mastra/core/workflows"
import { z } from "zod"

const validateInput = createStep({
  id: "validate-input",
  description: "Validates the org ID input",
  inputSchema: z.object({ orgId: z.string().uuid() }),
  outputSchema: z.object({ orgId: z.string() }),
  execute: async ({ inputData }) => {
    if (!inputData?.orgId) throw new Error("orgId is required")
    return { orgId: inputData.orgId }
  },
})

const gatherProcesses = createStep({
  id: "gather-processes",
  description: "Retrieves all process documents for the org",
  inputSchema: z.object({ orgId: z.string() }),
  outputSchema: z.object({ processes: z.string(), orgId: z.string() }),
  execute: async ({ inputData }) => {
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const supabase = createAdminClient()
    const { data } = await supabase
      .from("org_processes")
      .select("title, content")
      .eq("org_id", inputData.orgId)
    const text = (data ?? [])
      .map((p) => `## ${p.title}\n${p.content ?? ""}`)
      .join("\n\n---\n\n")
    return { processes: text || "No processes found.", orgId: inputData.orgId }
  },
})

const generateSummary = createStep({
  id: "generate-summary",
  description: "Uses the Process Assistant agent to generate a knowledge summary",
  inputSchema: z.object({ processes: z.string(), orgId: z.string() }),
  outputSchema: z.object({ summary: z.string() }),
  execute: async ({ inputData, mastra }) => {
    const agent = mastra?.getAgent("processAssistantAgent")
    if (!agent) {
      throw new Error("processAssistantAgent not found in Mastra registry")
    }
    const response = await agent.generate([
      {
        role: "user",
        content: `Summarise these business processes into a clear knowledge overview:\n\n${inputData.processes}`,
      },
    ])
    return { summary: response.text }
  },
})

const processKnowledgeSummaryWorkflow = createWorkflow({
  id: "process-knowledge-summary",
  inputSchema: z.object({ orgId: z.string().uuid() }),
  outputSchema: z.object({ summary: z.string() }),
})
  .then(validateInput)
  .then(gatherProcesses)
  .then(generateSummary)

processKnowledgeSummaryWorkflow.commit()

export { processKnowledgeSummaryWorkflow }
