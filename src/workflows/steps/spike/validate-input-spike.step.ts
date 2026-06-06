import { withSpikeStepLifecycle } from "@/src/workflows/runtime/spike-step-lifecycle"

export async function validateInputSpikeStep() {
  "use step"
  return withSpikeStepLifecycle("validate-input", async () => {
    return { ok: true }
  })
}
