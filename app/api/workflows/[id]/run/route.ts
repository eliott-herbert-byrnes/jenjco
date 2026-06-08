import { NextResponse } from "next/server"
import { z } from "zod"
import {
  encodeWorkflowStreamChunk,
  mapWorkflowStreamChunk,
} from "@/features/workflows/lib/workflow-stream"
import { getServerAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { WORKFLOWS, type WorkflowKey } from "@/src/workflows/index"
import { STATUS_STREAM_NAMESPACE } from "@/src/workflows/runtime/status-stream"
import {
  finalizeWorkflowRun,
  startWorkflowRun,
} from "@/src/workflows/runtime/triggers"

const uuidParam = z.string().uuid()

function isWorkflowKey(key: string): key is WorkflowKey {
  return key in WORKFLOWS
}

export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { appUser } = await getServerAuth()
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (appUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await context.params
  const idParsed = uuidParam.safeParse(id)
  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: wf, error: wfErr } = await supabase
    .from("org_workflows")
    .select("id, workflow_key, is_active")
    .eq("id", idParsed.data)
    .eq("org_id", appUser.orgId)
    .single()

  if (wfErr || !wf) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  if (!wf.is_active) {
    return NextResponse.json({ error: "Workflow is inactive" }, { status: 400 })
  }

  if (!isWorkflowKey(wf.workflow_key)) {
    return NextResponse.json(
      { error: "Workflow is not registered in the runtime" },
      { status: 500 }
    )
  }

  const workflowKey = wf.workflow_key
  const startedAt = Date.now()

  const startResult = await startWorkflowRun({
    orgId: appUser.orgId,
    workflowKey,
    trigger: "manual",
    startedByUserId: appUser.id,
    orgWorkflowId: wf.id,
  })

  if ("skipped" in startResult) {
    return NextResponse.json(
      { error: "Workflow is already running" },
      { status: 409 }
    )
  }

  const { ledgerRunId, run } = startResult

  const stream = new ReadableStream({
    async start(controller) {
      const statusReader = run
        .getReadable({ namespace: STATUS_STREAM_NAMESPACE })
        .getReader()

      const pumpStatus = (async () => {
        try {
          while (true) {
            const { done, value } = await statusReader.read()
            if (done) break
            const chunk = mapWorkflowStreamChunk(value)
            if (chunk) {
              controller.enqueue(encodeWorkflowStreamChunk(chunk))
            }
          }
        } catch {
          // Reader cancelled after workflow completes.
        } finally {
          statusReader.releaseLock()
        }
      })()

      void pumpStatus

      try {
        const result = await run.returnValue
        await statusReader.cancel()
        await pumpStatus

        await finalizeWorkflowRun({
          run,
          ledgerRunId,
          orgId: appUser.orgId,
          workflowKey: wf.workflow_key,
          startedByUserId: appUser.id,
          startedAt,
        })

        controller.enqueue(
          encodeWorkflowStreamChunk({ type: "workflow-result", result })
        )
      } catch (err) {
        await statusReader.cancel().catch(() => undefined)
        await pumpStatus

        const message = err instanceof Error ? err.message : String(err)

        await finalizeWorkflowRun({
          run,
          ledgerRunId,
          orgId: appUser.orgId,
          workflowKey: wf.workflow_key,
          startedByUserId: appUser.id,
          startedAt,
        })

        controller.enqueue(
          encodeWorkflowStreamChunk({ type: "error", message })
        )
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson" },
  })
}
