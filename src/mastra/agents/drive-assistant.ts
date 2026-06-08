import { Agent } from "@mastra/core/agent"
import { googleDriveSearchTool } from "../tools/google-drive-search-tool"

/** Memory-less agent for Google Drive search via Nango proxy. */
export const driveAssistantAgent = new Agent({
  id: "drive-assistant",
  name: "Drive Assistant",
  instructions: `You help users browse and search their organization's Google Drive files.
When the user asks about files, folders, or what's in Drive, always call the google-drive-search tool first.
If the tool returns error "not_connected", explain that an admin must connect Google Drive under Organisation → Integrations.
If the tool returns error "reconnect_required", explain that the Drive connection expired and an admin must reconnect under Organisation → Integrations.
Summarise file results clearly (name, type, last modified). Never mention or expose tokens, secrets, or raw API credentials.`,
  model: "openai/gpt-5-mini",
  tools: { googleDriveSearchTool },
})
