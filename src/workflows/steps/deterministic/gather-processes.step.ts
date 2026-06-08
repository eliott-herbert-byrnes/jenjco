import { createAdminClient } from "@/lib/supabase/admin"
import { withStepLifecycle } from "@/src/workflows/runtime/with-step-lifecycle"
import type { ValidateInputOutput } from "@/src/workflows/steps/deterministic/validate-input.step"
import { WORKFLOW_KEY_PROCESS_KNOWLEDGE_SUMMARY } from "@/src/workflows/types"

export type GatherProcessesOutput = {
  processes: string
  orgId: string
  ledgerRunId: string
  startedByUserId: string | null
}

export async function gatherProcessesStep(
  input: ValidateInputOutput
): Promise<GatherProcessesOutput> {
  "use step"

  return withStepLifecycle(
    {
      ledgerRunId: input.ledgerRunId,
      stepId: "gather-processes",
      kind: "deterministic",
      orgId: input.orgId,
      userId: input.startedByUserId,
      resourceKey: WORKFLOW_KEY_PROCESS_KNOWLEDGE_SUMMARY,
    },
    async () => {
      const supabase = createAdminClient()
      const { data } = await supabase
        .from("org_processes")
        .select("title, content")
        .eq("org_id", input.orgId)

      const text = (data ?? [])
        .map((p) => `## ${p.title}\n${p.content ?? ""}`)
        .join("\n\n---\n\n")

      return {
        processes: text || "No processes found.",
        orgId: input.orgId,
        ledgerRunId: input.ledgerRunId,
        startedByUserId: input.startedByUserId,
      }
    }
  )
}
