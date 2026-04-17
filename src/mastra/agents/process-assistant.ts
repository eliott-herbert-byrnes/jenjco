import { Agent } from "@mastra/core/agent"
import { Memory } from "@mastra/memory"
import { PostgresStore } from "@mastra/pg"
import { processSearchTool } from "../tools/process-search-tool"

export const processAssistantAgent = new Agent({
  id: "process-assistant",
  name: "Process Assistant",
  instructions: `You help users find and follow internal business processes.
When the user asks about any process, procedure, or "how do I...", always call the process-search tool first.
Summarise the retrieved process clearly. If no relevant process is found, say so and suggest who to ask.`,
  model: "openai/gpt-5-mini",
  tools: { processSearchTool },
  memory: new Memory({
    storage: new PostgresStore({
      id: "process-assistant-memory",
      connectionString: process.env.DATABASE_URL!,
      schemaName: "mastra",
    }),
  }),
})
