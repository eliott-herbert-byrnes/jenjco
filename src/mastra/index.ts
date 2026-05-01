import type { Mastra } from "@mastra/core/mastra"
import { Mastra as MastraClass } from "@mastra/core/mastra"
import { PinoLogger } from "@mastra/loggers"
import {
  Observability,
  DefaultExporter,
  CloudExporter,
  SensitiveDataFilter,
} from "@mastra/observability"
import { processKnowledgeSummaryWorkflow } from "./workflows/process-knowledge-summary-workflow"
import { processAssistantAgent } from "./agents/process-assistant"
import { getMastraStorage } from "./storage"

// Persist the Mastra instance across Next.js / Mastra dev HMR reloads so we
// don't leak pg.Pools on every module re-evaluation (see `./storage` for the
// shared PostgresStore singleton).
declare global {
  // eslint-disable-next-line no-var
  var __mastraInstance: MastraClass | undefined
}

/** Lazily construct Mastra so `next build` can load modules when DATABASE_URL is only set at runtime. */
export function getMastra(): MastraClass {
  if (!globalThis.__mastraInstance) {
    globalThis.__mastraInstance = new MastraClass({
      workflows: { processKnowledgeSummaryWorkflow },
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
