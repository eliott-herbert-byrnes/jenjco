import { generateSummaryStep } from "@/src/workflows/steps/ai/generate-summary.step"
import { gatherProcessesStep } from "@/src/workflows/steps/deterministic/gather-processes.step"
import { validateInputStep } from "@/src/workflows/steps/deterministic/validate-input.step"
import type { WorkflowRunInput } from "@/src/workflows/types"

export async function processKnowledgeSummaryWorkflow(input: WorkflowRunInput) {
  "use workflow"

  const validated = await validateInputStep(input)
  const gathered = await gatherProcessesStep(validated)
  const { text } = await generateSummaryStep(gathered)

  return { summary: text }
}
