import { start } from "workflow/api"
import type { Json } from "@/lib/database.types"
import { createAdminClient } from "@/lib/supabase/admin"
import { googleDriveIngestWorkflow } from "@/src/workflows/definitions/google-drive-ingest.workflow"
import * as ledger from "@/src/workflows/runtime/ledger"
import { STATUS_STREAM_NAMESPACE } from "@/src/workflows/runtime/status-stream"
import {
  recordWorkflowRollup,
  sumStepUsageForRun,
} from "@/src/workflows/runtime/usage"

const encoder = new TextEncoder()
const ndjson = (obj: unknown) => encoder.encode(`${JSON.stringify(obj)}\n`)

/**
 * Dev-only route to prove unattended Google Drive listing via workflow step (Phase 6).
 * POST /api/dev/drive-ingest  body: { orgId: string }
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

  const supabase = createAdminClient()
  const { data: orgWorkflow } = await supabase
    .from("org_workflows")
    .select("department_id")
    .eq("org_id", orgId)
    .eq("workflow_key", "google-drive-ingest")
    .limit(1)
    .maybeSingle()

  const departmentId = orgWorkflow?.department_id ?? null

  const workflowInput = {
    orgId,
    ledgerRunId,
    startedByUserId: null,
    departmentId,
  }

  const run = await start(googleDriveIngestWorkflow, [workflowInput])

  await ledger.createRun({
    id: ledgerRunId,
    orgId,
    workflowKey: "google-drive-ingest",
    vercelRunId: run.runId,
    startedBy: null,
    trigger: "manual",
    input: workflowInput as Json,
  })

  const stream = new ReadableStream({
    async start(controller) {
      const statusReader = run
        .getReadable({ namespace: STATUS_STREAM_NAMESPACE })
        .getReader()

      const statusEvents: unknown[] = []

      const pumpStatus = (async () => {
        try {
          while (true) {
            const { done, value } = await statusReader.read()
            if (done) break
            statusEvents.push(value)
          }
        } catch {
          // Reader cancelled after workflow completes — expected.
        } finally {
          statusReader.releaseLock()
        }
      })()

      try {
        const result = await run.returnValue
        await statusReader.cancel()
        await pumpStatus

        const { tokensIn, tokensOut } = await sumStepUsageForRun(ledgerRunId)

        await ledger.completeRun({
          ledgerRunId,
          output: result as Json,
          tokensIn,
          tokensOut,
        })
        await recordWorkflowRollup({
          orgId,
          userId: null,
          ledgerRunId,
          workflowKey: "google-drive-ingest",
          departmentId,
          tokensIn,
          tokensOut,
          durationMs: Date.now() - startedAt,
          status: "success",
        })

        for (const value of statusEvents) {
          controller.enqueue(ndjson(value))
        }
        controller.enqueue(
          ndjson({ type: "workflow-result", result, vercelRunId: run.runId })
        )
      } catch (err) {
        await statusReader.cancel().catch(() => undefined)
        await pumpStatus

        const message = err instanceof Error ? err.message : String(err)
        let tokensIn = 0
        let tokensOut = 0
        try {
          const totals = await sumStepUsageForRun(ledgerRunId)
          tokensIn = totals.tokensIn
          tokensOut = totals.tokensOut
        } catch {
          // Best-effort token roll-up on failure.
        }

        await ledger.failRun({ ledgerRunId, error: message })
        await recordWorkflowRollup({
          orgId,
          userId: null,
          ledgerRunId,
          workflowKey: "google-drive-ingest",
          departmentId,
          tokensIn,
          tokensOut,
          durationMs: Date.now() - startedAt,
          status: "error",
        })

        for (const value of statusEvents) {
          controller.enqueue(ndjson(value))
        }
        controller.enqueue(
          ndjson({
            type: "error",
            message,
            vercelRunId: run.runId,
          })
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "X-Workflow-Run-Id": run.runId,
    },
  })
}
