import { NextResponse } from "next/server"
import { z } from "zod"
import { getServerAuth } from "@/lib/auth"
import { logUsage } from "@/lib/usage-logger"
import { getMastra } from "@/mastra"
import { createClient } from "@/lib/supabase/server"

const uuidParam = z.string().uuid()

export async function POST(
  req: Request,
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

  let inputData: unknown
  try {
    const body = (await req.json()) as { inputData?: unknown }
    inputData = body.inputData
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const mastra = getMastra()
  let mastraWorkflow
  try {
    mastraWorkflow = mastra.getWorkflowById(wf.workflow_key)
  } catch {
    return NextResponse.json(
      { error: "Workflow is not registered in the runtime" },
      { status: 500 }
    )
  }

  const encoder = new TextEncoder()
  const send = (obj: unknown) => encoder.encode(`${JSON.stringify(obj)}\n`)

  const startTime = Date.now()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const run = await mastraWorkflow.createRun()
        const streamResult = run.stream({ inputData })

        const reader = streamResult.fullStream.getReader()
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            controller.enqueue(send(value))
          }
        } finally {
          reader.releaseLock()
        }

        const result = await streamResult.result
        controller.enqueue(send({ type: "workflow-result", result }))

        await logUsage({
          orgId: appUser.orgId,
          userId: appUser.id,
          resourceKey: wf.workflow_key,
          resourceType: "workflow",
          tokensIn: 0,
          tokensOut: 0,
          durationMs: Date.now() - startTime,
          status: "success",
        })
      } catch (err) {
        await logUsage({
          orgId: appUser.orgId,
          userId: appUser.id,
          resourceKey: wf.workflow_key,
          resourceType: "workflow",
          tokensIn: 0,
          tokensOut: 0,
          durationMs: Date.now() - startTime,
          status: "error",
        })
        controller.enqueue(send({ type: "error", message: String(err) }))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson" },
  })
}
