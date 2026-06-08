import { createHook } from "workflow"

const HOOK_TOKEN = "hook-spike-demo"

/** Dev-only workflow to verify createHook / resumeHook. Not registered in WORKFLOWS. */
export async function hookSpikeWorkflow() {
  "use workflow"
  const hook = createHook<{ message: string }>({ token: HOOK_TOKEN })
  const event = await hook
  return { received: event.message }
}

export { HOOK_TOKEN }
