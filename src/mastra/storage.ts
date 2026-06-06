import type { MastraCompositeStore } from "@mastra/core/storage"
import { PostgresStore } from "@mastra/pg"

// Persist the PostgresStore singleton across Next.js / Mastra dev HMR reloads.
// Without this, every module re-evaluation creates a new PostgresStore (and
// therefore a new pg.Pool). The old pools are never drained and quickly exhaust
// the Supabase pooler's `pool_size` limit ("EMAXCONNSESSION: max clients
// reached in session mode"). Kept in its own module so any agent/tool can
// import it without introducing a cycle with `src/mastra/index.ts`.
declare global {
  // eslint-disable-next-line no-var
  var __mastraPgStore: PostgresStore | undefined
}

function createMastraStorage(): PostgresStore {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Add your Supabase Postgres connection string to .env (required for Mastra PostgresStore)."
    )
  }
  return new PostgresStore({
    id: "mastra-storage",
    connectionString,
    // Mastra-managed tables (memory, workflows, observability, …) — keep separate from public app tables
    schemaName: "mastra",
    // Keep pool small: PostgresStore fans out into ~14 sibling sub-stores
    // (memory, blobs, traces, scorers, …) which all share this pool, and dev
    // HMR can leave stale pools alive. Supabase's pooler rejects once
    // `pool_size` is reached, so budget conservatively.
    max: 5,
    idleTimeoutMillis: 10_000,
  })
}

/** Shared Mastra PostgresStore. Cached on `globalThis` so HMR reloads reuse the same pg.Pool. */
export function getMastraStorage(): MastraCompositeStore {
  if (!globalThis.__mastraPgStore) {
    globalThis.__mastraPgStore = createMastraStorage()
  }
  // PostgresStore extends MastraCompositeStore, but TS treats #private fields as
  // nominal across package boundaries — cast to the type Mastra config expects.
  return globalThis.__mastraPgStore as unknown as MastraCompositeStore
}
