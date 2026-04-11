import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { Mastra } from '@mastra/core/mastra';
import { PinoLogger } from '@mastra/loggers';
import { LibSQLStore } from '@mastra/libsql';
import { DuckDBStore } from "@mastra/duckdb";
import { MastraCompositeStore } from '@mastra/core/storage';
import { Observability, DefaultExporter, CloudExporter, SensitiveDataFilter } from '@mastra/observability';
import { weatherWorkflow } from './workflows/weather-workflow';
import { weatherAgent } from './agents/weather-agent';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/**
 * DuckDB opens the DB file exclusively. If `next dev` and `mastra dev` both load this module,
 * they must use different files on Windows. Override with MASTRA_DUCKDB_PATH (absolute or relative to project root).
 */
function observabilityDuckDbPath(): string {
  const fromEnv = process.env.MASTRA_DUCKDB_PATH;
  if (fromEnv) {
    return path.isAbsolute(fromEnv) ? fromEnv : path.join(projectRoot, fromEnv);
  }
  // `pnpm dev` → npm_lifecycle_event "dev" (Next). `pnpm mastra:dev` → "mastra:dev".
  if (process.env.npm_lifecycle_event === 'dev') {
    return path.join(projectRoot, 'mastra-next.duckdb');
  }
  return path.join(projectRoot, 'mastra.duckdb');
}

export const mastra = new Mastra({
  workflows: { weatherWorkflow },
  agents: { weatherAgent },
  storage: new MastraCompositeStore({
    id: 'composite-storage',
    default: new LibSQLStore({
      id: "mastra-storage",
      url: "file:./mastra.db",
    }),
    domains: {
      observability: await new DuckDBStore({ path: observabilityDuckDbPath() }).getStore('observability'),
    }
  }),
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
