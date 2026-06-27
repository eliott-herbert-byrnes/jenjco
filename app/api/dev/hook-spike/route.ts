import { start } from "workflow/api"
import type { Json } from "@/lib/database.types"
import {
  HOOK_TOKEN,
  hookSpikeWorkflow,
} from "@/src/workflows/definitions/hook-spike.workflow"
import * as ledger from "@/src/workflows/runtime/ledger"
import { scheduleFinalize } from "@/src/workflows/runtime/triggers"

/**
 * Dev-only route to start the hook-spike workflow (pauses on createHook until resume).
 * POST /api/dev/hook-spike  body: { orgId: string }
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 })
  }

  let orgId: string
  try {
    const body = (await request.json()) as { orgId?: unknown }
    if (typeof body.orgId !== "string" || !body.orgId.trim()) {
      return Response.json({ error: "orgId is required" }, { status: 400 })
    }
    orgId = body.orgId.trim()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const ledgerRunId = crypto.randomUUID()
  const startedAt = Date.now()
  const run = await start(hookSpikeWorkflow)

  await ledger.createRun({
    id: ledgerRunId,
    orgId,
    workflowKey: "hook-spike",
    vercelRunId: run.runId,
    startedBy: null,
    trigger: "manual",
    input: null as Json,
  })

  scheduleFinalize({
    run,
    ledgerRunId,
    orgId,
    workflowKey: "hook-spike",
    startedByUserId: null,
    departmentId: null,
    startedAt,
  })

  return Response.json({
    ledgerRunId,
    vercelRunId: run.runId,
    hookToken: HOOK_TOKEN,
    resumeUrl: "/api/dev/hook-spike/resume",
    message:
      "Workflow paused on hook. POST /api/dev/hook-spike/resume with { message } to resume.",
  })
}
