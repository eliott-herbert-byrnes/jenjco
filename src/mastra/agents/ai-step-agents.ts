import { Agent } from "@mastra/core/agent"

/** Memory-less agent for durable workflow AI steps (no PostgresStore pressure on fan-out). */
export const processSummaryAgent = new Agent({
  id: "process-summary",
  name: "Process Summary",
  instructions: "Summarise business processes into a clear knowledge overview.",
  model: "openai/gpt-5-mini",
})
