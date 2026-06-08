import { HOOK_TOKEN } from "@/src/workflows/definitions/hook-spike.workflow"
import { resumeHookForRun } from "@/src/workflows/runtime/triggers"

/**
 * Dev-only route to resume the hook-spike workflow.
 * POST /api/dev/hook-spike/resume  body: { message: string }
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return new Response("Not found", { status: 404 })
  }

  let message: string
  try {
    const body = (await request.json()) as { message?: unknown }
    if (typeof body.message !== "string" || !body.message.trim()) {
      return Response.json({ error: "message is required" }, { status: 400 })
    }
    message = body.message.trim()
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  await resumeHookForRun(HOOK_TOKEN, { message })

  return Response.json({ ok: true, hookToken: HOOK_TOKEN, message })
}
