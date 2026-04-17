import type { Mastra } from "@mastra/core/mastra"
import { Mastra as MastraClass } from "@mastra/core/mastra"
import { PinoLogger } from "@mastra/loggers"
import { PostgresStore } from "@mastra/pg"
import {
  Observability,
  DefaultExporter,
  CloudExporter,
  SensitiveDataFilter,
} from "@mastra/observability"
import { weatherWorkflow } from "./workflows/weather-workflow"
import { processAssistantAgent } from "./agents/process-assistant"

// Persist singletons across Next.js / Mastra dev HMR reloads. Without this, every
// module re-evaluation creates a new PostgresStore + Mastra instance, each opening
// its own pg.Pool. The old pools are never drained and quickly exhaust the Supabase
// pooler's `max_client_conn` limit ("Max client connections reached").
declare global {
  // eslint-disable-next-line no-var
  var __mastraPgStore: PostgresStore | undefined
  // eslint-disable-next-line no-var
  var __mastraInstance: MastraClass | undefined
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
    // Keep pool small: Mastra also creates an internal observability pool,
    // and dev HMR can leave stale pools alive. Supabase's pooler rejects once
    // `max_client_conn` is reached, so budget conservatively.
    max: 5,
    idleTimeoutMillis: 10_000,
  })
}

function getMastraStorage(): PostgresStore {
  if (!globalThis.__mastraPgStore) {
    globalThis.__mastraPgStore = createMastraStorage()
  }
  return globalThis.__mastraPgStore
}

/** Lazily construct Mastra so `next build` can load modules when DATABASE_URL is only set at runtime. */
export function getMastra(): MastraClass {
  if (!globalThis.__mastraInstance) {
    globalThis.__mastraInstance = new MastraClass({
      workflows: { weatherWorkflow },
      agents: { processAssistantAgent },
      storage: getMastraStorage(),
      logger: new PinoLogger({
        name: "Mastra",
        level: "info",
      }),
      observability: new Observability({
        configs: {
          default: {
            serviceName: "mastra",
            exporters: [
              new DefaultExporter(), // Persists traces to storage for Mastra Studio
              new CloudExporter(), // Sends traces to Mastra Cloud (if MASTRA_CLOUD_ACCESS_TOKEN is set)
            ],
            spanOutputProcessors: [
              new SensitiveDataFilter(), // Redacts sensitive data like passwords, tokens, keys
            ],
          },
        },
      }),
    })
  }
  return globalThis.__mastraInstance
}

/**
 * Same instance as `getMastra()`, for `import { mastra }` (e.g. Mastra Studio / `mastra dev`).
 * Proxied so constructing PostgresStore waits until first property access.
 */
export const mastra: Mastra = new Proxy({} as Mastra, {
  get(_target, prop, _receiver) {
    const instance = getMastra()
    // Accessors on Mastra use private fields (#datasets, …); `this` must be the real instance,
    // not the Proxy — otherwise getters throw "Cannot read private member …".
    const value = Reflect.get(instance, prop, instance)
    if (typeof value === "function") {
      return value.bind(instance)
    }
    return value
  },
})
