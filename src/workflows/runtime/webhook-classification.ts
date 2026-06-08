import { getProviderByNangoIntegrationId } from "@/lib/integrations/providers"
import type { NangoWebhookPayload } from "./idempotency"

export type { NangoWebhookPayload }

export type WebhookClassification =
  | {
      action: "upsert_connection"
      orgId: string
      provider: string
      connectionId: string
      status: "active"
    }
  | { action: "reconnect_required"; connectionId: string }
  | {
      action: "start_workflow"
      workflowKey: "google-drive-ingest"
      connectionId: string
    }
  | { action: "noop"; reason: string }
  | { action: "unhandled"; reason: string }

export function resolveOrgIdFromPayload(
  payload: NangoWebhookPayload
): string | null {
  return (
    payload.tags?.organization_id ??
    payload.endUser?.organizationId ??
    null
  )
}

/** Pure routing table — no DB or workflow side effects. */
export function classifyNangoWebhook(
  payload: NangoWebhookPayload
): WebhookClassification {
  const { type } = payload

  if (type === "auth") {
    const { operation, success, connectionId, providerConfigKey } = payload

    if (
      success === true &&
      (operation === "creation" || operation === "override") &&
      connectionId &&
      providerConfigKey
    ) {
      const orgId = resolveOrgIdFromPayload(payload)
      if (!orgId) {
        return { action: "unhandled", reason: "auth_success_missing_org_id" }
      }

      const providerConfig = getProviderByNangoIntegrationId(providerConfigKey)
      if (!providerConfig) {
        return {
          action: "unhandled",
          reason: `unknown_provider_config:${providerConfigKey}`,
        }
      }

      return {
        action: "upsert_connection",
        orgId,
        provider: providerConfig.id,
        connectionId,
        status: "active",
      }
    }

    if (
      operation === "refresh" &&
      success === false &&
      connectionId
    ) {
      return { action: "reconnect_required", connectionId }
    }

    return { action: "noop", reason: `auth_noop:${operation}:${success}` }
  }

  if (type === "sync") {
    const { success, providerConfigKey, connectionId } = payload

    if (
      success === true &&
      providerConfigKey === "google-drive" &&
      connectionId
    ) {
      return {
        action: "start_workflow",
        workflowKey: "google-drive-ingest",
        connectionId,
      }
    }

    return { action: "noop", reason: `sync_noop:${providerConfigKey}:${success}` }
  }

  return { action: "unhandled", reason: `unknown_type:${type}` }
}
