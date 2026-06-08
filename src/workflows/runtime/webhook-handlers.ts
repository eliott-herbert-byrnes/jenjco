import { getProvider } from "@/lib/integrations/providers"
import { createAdminClient } from "@/lib/supabase/admin"
import type { NangoWebhookPayload } from "./idempotency"
import { hasRunningWorkflow } from "./idempotency"
import { scheduleFinalize, startWorkflowRun } from "./triggers"
import { classifyNangoWebhook } from "./webhook-classification"

export type { NangoWebhookPayload, WebhookClassification } from "./webhook-classification"
export { classifyNangoWebhook, resolveOrgIdFromPayload } from "./webhook-classification"

export type WebhookHandlerResult = {
  handled: boolean
  action?: string
  skipped?: boolean
  reason?: string
  ledgerRunId?: string
  error?: string
}

async function upsertOrgConnection({
  orgId,
  provider,
  connectionId,
  status,
}: {
  orgId: string
  provider: string
  connectionId: string
  status: "active"
}): Promise<void> {
  const supabase = createAdminClient()
  const providerConfig = getProvider(provider)
  if (!providerConfig) {
    throw new Error(`Unknown provider: ${provider}`)
  }

  const now = new Date().toISOString()
  const { error } = await supabase.from("org_connections").upsert(
    {
      org_id: orgId,
      provider,
      owner_type: providerConfig.ownerTypeDefault,
      nango_connection_id: connectionId,
      status,
      updated_at: now,
    },
    { onConflict: "org_id,provider,owner_type" }
  )

  if (error) throw error
}

async function markReconnectRequired(connectionId: string): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase
    .from("org_connections")
    .update({
      status: "reconnect_required",
      updated_at: new Date().toISOString(),
    })
    .eq("nango_connection_id", connectionId)

  if (error) throw error
}

async function resolveOrgIdFromConnection(
  connectionId: string
): Promise<string | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("org_connections")
    .select("org_id")
    .eq("nango_connection_id", connectionId)
    .maybeSingle()

  if (error) throw error
  return data?.org_id ?? null
}

async function hasActiveOrgWorkflow(
  orgId: string,
  workflowKey: string
): Promise<boolean> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("org_workflows")
    .select("id")
    .eq("org_id", orgId)
    .eq("workflow_key", workflowKey)
    .eq("is_active", true)
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data !== null
}

export async function handleNangoWebhook(
  payload: NangoWebhookPayload
): Promise<WebhookHandlerResult> {
  const classification = classifyNangoWebhook(payload)

  switch (classification.action) {
    case "upsert_connection": {
      await upsertOrgConnection(classification)
      return { handled: true, action: "upsert_connection" }
    }

    case "reconnect_required": {
      await markReconnectRequired(classification.connectionId)
      return { handled: true, action: "reconnect_required" }
    }

    case "start_workflow": {
      const orgId = await resolveOrgIdFromConnection(classification.connectionId)
      if (!orgId) {
        console.warn(
          "[webhook] sync.success: no org_connections row for",
          classification.connectionId
        )
        return {
          handled: true,
          action: "start_workflow",
          skipped: true,
          reason: "connection_not_found",
        }
      }

      const isActive = await hasActiveOrgWorkflow(
        orgId,
        classification.workflowKey
      )
      if (!isActive) {
        return {
          handled: true,
          action: "start_workflow",
          skipped: true,
          reason: "workflow_not_active",
        }
      }

      const alreadyRunning = await hasRunningWorkflow(
        orgId,
        classification.workflowKey
      )
      if (alreadyRunning) {
        return {
          handled: true,
          action: "start_workflow",
          skipped: true,
          reason: "already_running",
        }
      }

      const startedAt = Date.now()
      const result = await startWorkflowRun({
        orgId,
        workflowKey: classification.workflowKey,
        trigger: "event",
        startedByUserId: null,
      })

      if ("skipped" in result) {
        return {
          handled: true,
          action: "start_workflow",
          skipped: true,
          reason: result.reason,
        }
      }

      scheduleFinalize({
        run: result.run,
        ledgerRunId: result.ledgerRunId,
        orgId,
        workflowKey: classification.workflowKey,
        startedByUserId: null,
        startedAt,
      })

      return {
        handled: true,
        action: "start_workflow",
        ledgerRunId: result.ledgerRunId,
      }
    }

    case "noop": {
      return {
        handled: true,
        action: "noop",
        reason: classification.reason,
      }
    }

    case "unhandled": {
      console.warn("[webhook] unhandled Nango event:", classification.reason)
      return { handled: false, reason: classification.reason }
    }
  }
}
