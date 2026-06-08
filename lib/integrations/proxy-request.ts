import {
  ConnectionError,
  extractErrorCode,
  isAuthDeadError,
} from "@/lib/integrations/errors"
import { getConnection } from "@/lib/integrations/get-connection"
import {
  logIntegrationInvocation,
  type InvocationTriggerType,
} from "@/lib/integrations/log-invocation"
import { getNango } from "@/lib/integrations/nango"
import { getProvider, type ProviderId } from "@/lib/integrations/providers"
import { createAdminClient } from "@/lib/supabase/admin"

export type ProxyRequestParams = Record<
  string,
  string | number | string[] | number[]
>

export type ProxyRequestOptions = {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  endpoint: string
  params?: ProxyRequestParams
  data?: unknown
  headers?: Record<string, string>
  triggerType: InvocationTriggerType
  resourceKey?: string
  userId?: string | null
}

export async function proxyRequest<T = unknown>(
  orgId: string,
  provider: ProviderId,
  options: ProxyRequestOptions
): Promise<T> {
  const providerConfig = getProvider(provider)
  if (!providerConfig) {
    throw new Error(`Unknown provider: ${provider}`)
  }

  const connection = await getConnection(orgId, provider)
  const startedAt = Date.now()
  const nango = getNango()

  const baseLog = {
    orgId,
    provider,
    orgConnectionId: connection.orgConnectionId,
    userId: options.userId ?? null,
    triggerType: options.triggerType,
    resourceKey: options.resourceKey ?? null,
    method: options.method,
    endpoint: options.endpoint,
  }

  try {
    const response = await nango.proxy<T>({
      method: options.method,
      endpoint: options.endpoint,
      params: options.params,
      data: options.data,
      headers: options.headers,
      connectionId: connection.connectionId,
      providerConfigKey: providerConfig.nangoIntegrationId,
    })

    await logIntegrationInvocation({
      ...baseLog,
      status: "success",
      durationMs: Date.now() - startedAt,
    })

    return response.data
  } catch (err) {
    const durationMs = Date.now() - startedAt
    const errorCode = extractErrorCode(err)

    if (isAuthDeadError(err)) {
      const supabase = createAdminClient()
      const { error: updateError } = await supabase
        .from("org_connections")
        .update({
          status: "reconnect_required",
          updated_at: new Date().toISOString(),
        })
        .eq("id", connection.orgConnectionId)

      if (updateError) {
        console.error(
          "[integrations] failed to mark reconnect_required:",
          updateError.message
        )
      }

      await logIntegrationInvocation({
        ...baseLog,
        status: "error",
        errorCode,
        durationMs,
      })

      throw new ConnectionError(provider, "reconnect_required")
    }

    await logIntegrationInvocation({
      ...baseLog,
      status: "error",
      errorCode,
      durationMs,
    })

    throw err
  }
}
