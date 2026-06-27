import { runMastraProcessSummary } from "@/src/workflows/adapters/mastra-step"
import { withStepLifecycle } from "@/src/workflows/runtime/with-step-lifecycle"
import type { GatherProcessesOutput } from "@/src/workflows/steps/deterministic/gather-processes.step"
import { WORKFLOW_KEY_PROCESS_KNOWLEDGE_SUMMARY } from "@/src/workflows/types"

export async function generateSummaryStep(
  input: GatherProcessesOutput
): Promise<{ text: string }> {
  "use step"

  return withStepLifecycle(
    {
      ledgerRunId: input.ledgerRunId,
      stepId: "generate-summary",
      kind: "ai",
      orgId: input.orgId,
      userId: input.startedByUserId,
      resourceKey: WORKFLOW_KEY_PROCESS_KNOWLEDGE_SUMMARY,
      departmentId: input.departmentId,
    },
    () =>
      runMastraProcessSummary({
        orgId: input.orgId,
        userId: input.startedByUserId,
        ledgerRunId: input.ledgerRunId,
        stepId: "generate-summary",
        resourceKey: WORKFLOW_KEY_PROCESS_KNOWLEDGE_SUMMARY,
        departmentId: input.departmentId,
        processes: input.processes,
      })
  )
}
