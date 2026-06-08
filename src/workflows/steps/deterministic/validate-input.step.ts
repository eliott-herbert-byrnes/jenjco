import { withStepLifecycle } from "@/src/workflows/runtime/with-step-lifecycle"
import {
  WORKFLOW_KEY_PROCESS_KNOWLEDGE_SUMMARY,
  type WorkflowRunInput,
} from "@/src/workflows/types"

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export type ValidateInputOutput = {
  orgId: string
  ledgerRunId: string
  startedByUserId: string | null
}

export async function validateInputStep(
  input: WorkflowRunInput
): Promise<ValidateInputOutput> {
  "use step"

  return withStepLifecycle(
    {
      ledgerRunId: input.ledgerRunId,
      stepId: "validate-input",
      kind: "deterministic",
      orgId: input.orgId,
      userId: input.startedByUserId,
      resourceKey: WORKFLOW_KEY_PROCESS_KNOWLEDGE_SUMMARY,
    },
    async () => {
      if (!input.orgId) throw new Error("orgId is required")
      if (!UUID_RE.test(input.orgId)) {
        throw new Error("orgId must be a valid UUID")
      }
      return {
        orgId: input.orgId,
        ledgerRunId: input.ledgerRunId,
        startedByUserId: input.startedByUserId,
      }
    }
  )
}
