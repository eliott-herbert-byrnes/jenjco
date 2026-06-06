import { start } from "workflow/api"
import { STATUS_STREAM_NAMESPACE } from "@/src/workflows/runtime/status-stream"
import { spikeWorkflow } from "@/src/workflows/definitions/_spike.workflow"

const encoder = new TextEncoder()
const ndjson = (obj: unknown) => encoder.encode(`${JSON.stringify(obj)}\n`)

/**
 * Dev-only route to exercise durable execution + status namespace streaming (Stage 3.0b).
 * POST /api/dev/workflow-spike
 */
export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 })
  }

  const run = await start(spikeWorkflow)

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

        for (const value of statusEvents) {
          controller.enqueue(ndjson(value))
        }
        controller.enqueue(
          ndjson({ type: "workflow-result", result, vercelRunId: run.runId })
        )
      } catch (err) {
        await statusReader.cancel().catch(() => undefined)
        await pumpStatus

        for (const value of statusEvents) {
          controller.enqueue(ndjson(value))
        }
        controller.enqueue(
          ndjson({
            type: "error",
            message: err instanceof Error ? err.message : String(err),
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
