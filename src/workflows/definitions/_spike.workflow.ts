import { validateInputSpikeStep } from "@/src/workflows/steps/spike/validate-input-spike.step"

/** Dev-only spike workflow — delete or gate before PR 3 merge. */
export async function spikeWorkflow() {
  "use workflow"
  return validateInputSpikeStep()
}
