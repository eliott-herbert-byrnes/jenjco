/** @type {import('next').NextConfig} */
const nextConfig = {
  // Native DuckDB bindings use platform-specific .node files; bundling resolves every branch.
  serverExternalPackages: [
    '@mastra/duckdb',
    '@duckdb/node-api',
    '@duckdb/node-bindings',
  ],
}

export default nextConfig
