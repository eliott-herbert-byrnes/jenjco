import { readFileSync } from "node:fs"
import { spawnSync } from "node:child_process"

function getDirectDbUrl() {
  const env = readFileSync(".env", "utf8")
  const match = env.match(/^DATABASE_URL=(.+)$/m)
  if (!match) throw new Error("DATABASE_URL not found in .env")

  return match[1].trim()
}

const [command, ...args] = process.argv.slice(2)
if (!command) {
  console.error("Usage: node scripts/run-supabase-cli.mjs <supabase-subcommand> [...args]")
  process.exit(1)
}

const dbUrl = getDirectDbUrl()
const result = spawnSync(
  "pnpm",
  ["exec", "supabase", command, ...args, "--db-url", dbUrl, "--yes"],
  { stdio: "inherit", shell: true }
)

process.exit(result.status ?? 1)
