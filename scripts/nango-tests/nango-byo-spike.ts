/**
 * Stage 4 BYO spike — manual Nango validation (Phase 0c).
 *
 * Run from repo root (loads .env via dotenv):
 *   pnpm exec tsx scripts/nango-tests/nango-byo-spike.ts a
 *   pnpm exec tsx scripts/nango-tests/nango-byo-spike.ts b
 *   pnpm exec tsx scripts/nango-tests/nango-byo-spike.ts c
 *   pnpm exec tsx scripts/nango-tests/nango-byo-spike.ts c-verify
 *
 * Required env: NANGO_SECRET_KEY, NANGO_SPIKE_ORG_ID, GOOGLE_OAUTH_CLIENT_ID,
 *   GOOGLE_OAUTH_CLIENT_SECRET
 * Optional env: NANGO_SPIKE_END_USER_EMAIL (default: spike-admin@example.com)
 */
import "dotenv/config"
import { readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

import { Nango } from "@nangohq/node"

const INTEGRATION_ID = "google-drive"
const END_USER_ID = "spike-admin"

const __dirname = dirname(fileURLToPath(import.meta.url))
const STATE_PATH = join(__dirname, ".byo-spike-state.json")

type SpikeState = {
  organizationId: string
  connectionId: string
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required env: ${name}`)
  }
  return value
}

function getConfig() {
  return {
    orgId: requireEnv("NANGO_SPIKE_ORG_ID"),
    clientId: requireEnv("GOOGLE_OAUTH_CLIENT_ID"),
    clientSecret: requireEnv("GOOGLE_OAUTH_CLIENT_SECRET"),
    endUserEmail:
      process.env.NANGO_SPIKE_END_USER_EMAIL?.trim() ?? "spike-admin@example.com",
  }
}

function getNango(): Nango {
  const secretKey = requireEnv("NANGO_SECRET_KEY")
  const host = process.env.NANGO_SERVER_URL?.trim()
  return new Nango(host ? { secretKey, host } : { secretKey })
}

function buildTags(orgId: string, endUserEmail: string) {
  return {
    organization_id: orgId,
    end_user_id: END_USER_ID,
    end_user_email: endUserEmail,
  }
}

function buildSessionOverrides(clientId: string, clientSecret: string) {
  return {
    integrations_config_defaults: {
      [INTEGRATION_ID]: {
        connection_config: {
          oauth_client_id_override: clientId,
          oauth_client_secret_override: clientSecret,
        },
      },
    },
  }
}

function writeState(state: SpikeState) {
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), "utf8")
}

function readState(): SpikeState {
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf8")) as SpikeState
  } catch {
    throw new Error(
      `Missing spike state at ${STATE_PATH}. Run step "b" after completing step "a" OAuth.`
    )
  }
}

async function listOrgConnections(nango: Nango, orgId: string) {
  const { connections } = await nango.listConnections({
    integrationId: INTEGRATION_ID,
    tags: { organization_id: orgId },
  })
  return connections
}

async function stepA(nango: Nango) {
  const { orgId, clientId, clientSecret, endUserEmail } = getConfig()

  const { data } = await nango.createConnectSession({
    allowed_integrations: [INTEGRATION_ID],
    tags: buildTags(orgId, endUserEmail),
    ...buildSessionOverrides(clientId, clientSecret),
  })

  console.log("Test A — open this link and complete Google OAuth:")
  console.log(data.connect_link)
  console.log("\nThen run: pnpm exec tsx scripts/nango-tests/nango-byo-spike.ts b")
}

async function stepB(nango: Nango) {
  const { orgId } = getConfig()
  const connections = await listOrgConnections(nango, orgId)

  console.log("Test B — connection count:", connections.length)

  if (connections.length !== 1 || !connections[0]) {
    console.error(
      "Expected exactly 1 connection. Complete Test A OAuth first, wait a few seconds, then re-run step b."
    )
    process.exit(1)
  }

  const connection = connections[0]
  writeState({
    organizationId: orgId,
    connectionId: connection.connection_id,
  })

  console.log("Test B — connection:", connection)
  console.log(`\nSaved connection_id to ${STATE_PATH}`)
  console.log(
    "Confirm nango connection_id ≠ organization_id:",
    connection.connection_id !== orgId ? "yes" : "NO — unexpected"
  )
  console.log("\nThen run: pnpm exec tsx scripts/nango-tests/nango-byo-spike.ts c")
}

async function stepC(nango: Nango) {
  const { clientId, clientSecret, endUserEmail } = getConfig()
  const { organizationId, connectionId } = readState()

  const { data } = await nango.createReconnectSession({
    connection_id: connectionId,
    integration_id: INTEGRATION_ID,
    tags: buildTags(organizationId, endUserEmail),
    ...buildSessionOverrides(clientId, clientSecret),
  })

  console.log("Test C — open reconnect link and complete Google OAuth again:")
  console.log(data.connect_link)
  console.log(
    "\nThen run: pnpm exec tsx scripts/nango-tests/nango-byo-spike.ts c-verify"
  )
}

async function stepCVerify(nango: Nango) {
  const { organizationId, connectionId: beforeId } = readState()
  const connections = await listOrgConnections(nango, organizationId)

  console.log("Test C-verify — connection count:", connections.length)

  if (connections.length !== 1 || !connections[0]) {
    console.error(
      "Expected exactly 1 connection after reconnect. Complete Test C OAuth first, then re-run c-verify."
    )
    process.exit(1)
  }

  const afterId = connections[0].connection_id
  const sameId = afterId === beforeId

  console.log("Test C-verify — connection:", connections[0])
  console.log("Before reconnect connection_id:", beforeId)
  console.log("After reconnect connection_id:", afterId)
  console.log("Same connection_id (no duplicate):", sameId ? "PASS" : "FAIL")

  if (!sameId) {
    process.exit(1)
  }

  console.log("\nAll spike checks complete. Record outcomes in .cursor/plans/stage4_byo_spike.md")
}

function printUsage() {
  console.log(`Usage: pnpm exec tsx scripts/nango-tests/nango-byo-spike.ts <step>

Steps:
  a         Create connect session (BYO overrides) — open link, complete OAuth
  b         List connections by organization_id tag — expect count 1
  c         Create reconnect session — open link, re-authorize
  c-verify  Confirm still 1 connection with same connection_id`)
}

const step = process.argv[2]?.toLowerCase()

if (!step) {
  printUsage()
  process.exit(1)
}

const nango = getNango()

switch (step) {
  case "a":
    await stepA(nango)
    break
  case "b":
    await stepB(nango)
    break
  case "c":
    await stepC(nango)
    break
  case "c-verify":
    await stepCVerify(nango)
    break
  default:
    console.error(`Unknown step: ${step}\n`)
    printUsage()
    process.exit(1)
}
