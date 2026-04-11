import { Agent } from '@mastra/core/agent';
import { Memory } from '@mastra/memory';

/** Demo org-facing key; expand with tools/RAG in later phases. */
export const processAssistantAgent = new Agent({
  id: 'process-assistant',
  name: 'Process Assistant',
  instructions: `
You help users find and follow internal processes: sales, operations, and customer service.
Answer clearly and concisely. When you do not have enough context, say what is missing and suggest who to ask next.
`,
  model: 'openai/gpt-5-mini',
  memory: new Memory(),
});
