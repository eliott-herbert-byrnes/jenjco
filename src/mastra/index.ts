import type { Mastra } from '@mastra/core/mastra';
import { Mastra as MastraClass } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { PostgresStore } from '@mastra/pg';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';
import { weatherWorkflow } from './workflows/weather-workflow';
import { processAssistantAgent } from './agents/process-assistant';
import { weatherAgent } from './agents/weather-agent';

function createMastraStorage(): PostgresStore {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL is not set. Add your Supabase Postgres connection string to .env (required for Mastra PostgresStore).'
    );
  }
  return new PostgresStore({
    id: 'mastra-storage',
    connectionString,
    // Mastra-managed tables (memory, workflows, observability, …) — keep separate from public app tables
    schemaName: 'mastra',
  });
}

let mastraSingleton: MastraClass | null = null;

/** Lazily construct Mastra so `next build` can load modules when DATABASE_URL is only set at runtime. */
export function getMastra(): MastraClass {
  if (!mastraSingleton) {
    mastraSingleton = new MastraClass({
      workflows: { weatherWorkflow },
      agents: { weatherAgent, processAssistantAgent },
      storage: createMastraStorage(),
      logger: new PinoLogger({
        name: 'Mastra',
        level: 'info',
      }),
      observability: new Observability({
        configs: {
          default: {
            serviceName: 'mastra',
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
    });
  }
  return mastraSingleton;
}

/**
 * Same instance as `getMastra()`, for `import { mastra }` (e.g. Mastra Studio / `mastra dev`).
 * Proxied so constructing PostgresStore waits until first property access.
 */
export const mastra: Mastra = new Proxy({} as Mastra, {
  get(_target, prop, receiver) {
    const instance = getMastra();
    const value = Reflect.get(instance, prop, receiver);
    if (typeof value === 'function') {
      return value.bind(instance);
    }
    return value;
  },
});
