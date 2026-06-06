import { openai } from "@ai-sdk/openai"
import { embed } from "ai"

/**
 * Generates a 1536-dimension vector using OpenAI text-embedding-3-small.
 *
 * MVP constraint: the model accepts up to ~8,191 tokens (~6,000 words).
 * Process documents exceeding this limit will be silently truncated by the API.
 * Post-MVP: implement chunked embedding (e.g. split on headings, embed each
 * chunk separately, store multiple rows, aggregate at retrieval time).
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: text,
  })
  return embedding
}

/** pgvector columns are typed as string in generated Supabase types. */
export function formatEmbeddingForPg(embedding: number[]): string {
  return `[${embedding.join(",")}]`
}
