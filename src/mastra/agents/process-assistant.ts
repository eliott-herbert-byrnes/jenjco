import { Agent } from "@mastra/core/agent"
import { Memory } from "@mastra/memory"
import { processSearchTool } from "../tools/process-search-tool"
import { getMastraStorage } from "../storage"

export const processAssistantAgent = new Agent({
  id: "process-assistant",
  name: "Process Assistant",
  instructions: `You help users find and follow internal business processes.
When the user asks about any process, procedure, or "how do I...", always call the process-search tool first.
Summarise the retrieved process clearly. If no relevant process is found, say so and suggest who to ask.`,
  model: "openai/gpt-5-mini",
  tools: { processSearchTool },
  // Share the Mastra-wide PostgresStore singleton so we don't open a second
  // pg.Pool per HMR reload (caused EMAXCONNSESSION on Supabase's session pooler).
  memory: new Memory({
    storage: getMastraStorage(),
  }),
})
