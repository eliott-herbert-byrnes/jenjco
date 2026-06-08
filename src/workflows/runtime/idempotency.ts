import { createAdminClient } from "@/lib/supabase/admin"

export type NangoWebhookPayload = {
  type: string
  operation?: string
  connectionId?: string
  providerConfigKey?: string
  success?: boolean
  modifiedAfter?: string
  failedAt?: string
  startedAt?: string
  syncName?: string
  tags?: Record<string, string>
  endUser?: {
    organizationId?: string
    tags?: Record<string, string>
  }
}

/** Timestamp field used in webhook idempotency keys (sync events). */
export function getWebhookTimestampField(payload: NangoWebhookPayload): string {
  return payload.modifiedAfter ?? payload.failedAt ?? payload.startedAt ?? ""
}

/**
 * Deterministic dedup key: webhook:{type}:{operation}:{connectionId}:{timestamp}
 * Auth events omit a timestamp; sync events use modifiedAfter / failedAt / startedAt.
 */
export function buildWebhookIdempotencyKey(payload: NangoWebhookPayload): string {
  const type = payload.type ?? ""
  const operation = payload.operation ?? payload.syncName ?? ""
  const connectionId = payload.connectionId ?? ""
  const timestamp = getWebhookTimestampField(payload)
  return `webhook:${type}:${operation}:${connectionId}:${timestamp}`
}

/** Guards Vercel cron double-fire for the same org_workflow on one UTC day. */
export function buildCronWindowKey(orgWorkflowId: string, date: Date): string {
  const yyyy = date.getUTCFullYear()
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(date.getUTCDate()).padStart(2, "0")
  return `cron:${orgWorkflowId}:${yyyy}-${mm}-${dd}`
}

export async function hasRunningWorkflow(
  orgId: string,
  workflowKey: string
): Promise<boolean> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("workflow_runs")
    .select("id")
    .eq("org_id", orgId)
    .eq("workflow_key", workflowKey)
    .eq("status", "running")
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data !== null
}

/** Insert idempotency row; returns false when the key already exists. */
export async function claimWebhookDelivery(key: string): Promise<boolean> {
  const supabase = createAdminClient()
  const { error } = await supabase.from("webhook_deliveries").insert({
    idempotency_key: key,
    source: "nango",
  })

  if (error) {
    if (error.code === "23505") return false
    throw error
  }
  return true
}
