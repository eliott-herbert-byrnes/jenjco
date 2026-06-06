import { readFileSync, writeFileSync } from "node:fs"
import { spawnSync } from "node:child_process"

const env = readFileSync(".env", "utf8")
const match = env.match(/^DATABASE_URL=(.+)$/m)
if (!match) {
  console.error("DATABASE_URL not found in .env")
  process.exit(1)
}

const dbUrl = match[1].trim()
const result = spawnSync(
  "pnpm",
  ["exec", "supabase", "gen", "types", "typescript", "--db-url", dbUrl, "--schema", "public"],
  { encoding: "utf8", shell: true }
)

if (result.status !== 0) {
  process.stderr.write(result.stderr ?? "")
  process.exit(result.status ?? 1)
}

writeFileSync("lib/database.types.ts", result.stdout)
console.log("Wrote lib/database.types.ts")
