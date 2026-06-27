import { RequestContext } from "@mastra/core/request-context"
import { getMastra } from "@/mastra"
import { recordStepUsage } from "@/src/workflows/runtime/usage"

export type MastraProcessSummaryParams = {
  orgId: string
  userId: string | null
  ledgerRunId: string
  stepId: string
  resourceKey: string
  departmentId: string | null
  processes: string
}

/**
 * Sole Mastra entry point for workflow AI steps.
 * Generates a process knowledge summary and records per-step token usage.
 */
export async function runMastraProcessSummary({
  orgId,
  userId,
  ledgerRunId,
  stepId,
  resourceKey,
  departmentId,
  processes,
}: MastraProcessSummaryParams): Promise<{ text: string }> {
  "use step"

  const agent = getMastra().getAgent("processSummaryAgent")
  const requestContext = new RequestContext<{ orgId: string }>()
  requestContext.set("orgId", orgId)

  const startedAt = Date.now()

  try {
    const res = await agent.generate(
      [
        {
          role: "user",
          content: `Summarise these business processes into a clear knowledge overview:\n\n${processes}`,
        },
      ],
      { requestContext }
    )

    const tokensIn = res.usage?.inputTokens ?? 0
    const tokensOut = res.usage?.outputTokens ?? 0

    await recordStepUsage({
      orgId,
      userId,
      ledgerRunId,
      stepId,
      resourceKey,
      departmentId,
      tokensIn,
      tokensOut,
      durationMs: Date.now() - startedAt,
      status: "success",
    })

    return { text: res.text }
  } catch (err) {
    await recordStepUsage({
      orgId,
      userId,
      ledgerRunId,
      stepId,
      resourceKey,
      departmentId,
      tokensIn: 0,
      tokensOut: 0,
      durationMs: Date.now() - startedAt,
      status: "error",
    })
    throw err
  }
}
