import { NextResponse } from "next/server"

import { getServerAuth } from "@/lib/auth"
import { getNango } from "@/lib/integrations/nango"
import { getProvider, isProviderId } from "@/lib/integrations/providers"
import {
  buildConnectTags,
  buildSessionOverrides,
  getProviderCredentials,
} from "@/lib/integrations/session-config"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(
  _request: Request,
  context: { params: Promise<{ provider: string }> }
) {
  const { appUser } = await getServerAuth()
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (appUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { provider: providerParam } = await context.params
  if (!isProviderId(providerParam)) {
    return NextResponse.json({ error: "Invalid provider" }, { status: 400 })
  }

  const provider = getProvider(providerParam)!
  const creds = await getProviderCredentials(appUser.orgId, providerParam)
  if (!creds) {
    return NextResponse.json(
      {
        error:
          "OAuth credentials not configured. Save your client ID and secret on the integrations page first.",
      },
      { status: 400 }
    )
  }

  const supabase = createAdminClient()
  const { data: existingConnection, error: connError } = await supabase
    .from("org_connections")
    .select("nango_connection_id, status")
    .eq("org_id", appUser.orgId)
    .eq("provider", providerParam)
    .eq("owner_type", provider.ownerTypeDefault)
    .maybeSingle()

  if (connError) {
    return NextResponse.json({ error: connError.message }, { status: 500 })
  }

  const nango = getNango()
  const tags = buildConnectTags(appUser.orgId, appUser)
  const sessionOverrides = buildSessionOverrides(provider, creds)

  try {
    if (existingConnection?.status === "reconnect_required") {
      const { data } = await nango.createReconnectSession({
        connection_id: existingConnection.nango_connection_id,
        integration_id: provider.nangoIntegrationId,
        tags,
        ...sessionOverrides,
      })
      return NextResponse.json({ sessionToken: data.token })
    }

    const { data } = await nango.createConnectSession({
      allowed_integrations: [provider.nangoIntegrationId],
      tags,
      ...sessionOverrides,
    })
    return NextResponse.json({ sessionToken: data.token })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create connect session"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
