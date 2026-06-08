import { NextResponse } from "next/server"

import { getServerAuth } from "@/lib/auth"
import { getNango } from "@/lib/integrations/nango"
import { getProvider, isProviderId } from "@/lib/integrations/providers"
import { createAdminClient } from "@/lib/supabase/admin"

const MAX_ATTEMPTS = 5
const RETRY_DELAY_MS = 500

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

type NangoConnection = {
  connection_id: string
  created_at?: string
}

function pickNewestConnection(connections: NangoConnection[]): NangoConnection | null {
  if (connections.length === 0) return null
  if (connections.length === 1) return connections[0] ?? null

  return [...connections].sort((a, b) => {
    const aTime = a.created_at ? Date.parse(a.created_at) : 0
    const bTime = b.created_at ? Date.parse(b.created_at) : 0
    return bTime - aTime
  })[0] ?? null
}

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
  const nango = getNango()
  let connection: NangoConnection | null = null

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) await sleep(RETRY_DELAY_MS)

    try {
      const { connections } = await nango.listConnections({
        tags: { organization_id: appUser.orgId },
        integrationId: provider.nangoIntegrationId,
      })
      connection = pickNewestConnection(connections as NangoConnection[])
      if (connection) break
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to list connections"
      return NextResponse.json({ error: message }, { status: 500 })
    }
  }

  if (!connection) {
    return NextResponse.json(
      {
        error:
          "Connection not found yet. Complete authorization in the popup and try again.",
      },
      { status: 404 }
    )
  }

  const supabase = createAdminClient()
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from("org_connections")
    .upsert(
      {
        org_id: appUser.orgId,
        provider: providerParam,
        owner_type: provider.ownerTypeDefault,
        nango_connection_id: connection.connection_id,
        status: "active",
        connected_by_user_id: appUser.id,
        updated_at: now,
      },
      { onConflict: "org_id,provider,owner_type" }
    )
    .select("nango_connection_id, status")
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    connectionId: data.nango_connection_id,
    status: data.status,
  })
}
