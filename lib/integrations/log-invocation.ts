import { createAdminClient } from "@/lib/supabase/admin"

export type InvocationTriggerType = "agent" | "workflow_step" | "manual"

export type LogInvocationInput = {
  orgId: string
  provider: string
  orgConnectionId: string | null
  userId?: string | null
  triggerType: InvocationTriggerType
  resourceKey?: string | null
  method?: string | null
  endpoint?: string | null
  status: "success" | "error"
  errorCode?: string | null
  durationMs?: number | null
}

export async function logIntegrationInvocation(
  input: LogInvocationInput
): Promise<void> {
  const supabase = createAdminClient()

  const { error } = await supabase.from("integration_invocations").insert({
    org_id: input.orgId,
    provider: input.provider,
    org_connection_id: input.orgConnectionId,
    user_id: input.userId ?? null,
    trigger_type: input.triggerType,
    resource_key: input.resourceKey ?? null,
    method: input.method ?? null,
    endpoint: input.endpoint ?? null,
    status: input.status,
    error_code: input.errorCode ?? null,
    duration_ms: input.durationMs ?? null,
  })

  if (error) {
    console.error("[integrations] failed to log invocation:", error.message)
  }
}
