import { createAdminClient } from "@/lib/supabase/admin"
import { ConnectionError } from "@/lib/integrations/errors"
import type { ProviderId } from "@/lib/integrations/providers"

export type ResolvedConnection = {
  orgConnectionId: string
  connectionId: string
  provider: ProviderId
}

export async function getConnection(
  orgId: string,
  provider: ProviderId
): Promise<ResolvedConnection> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("org_connections")
    .select("id, nango_connection_id, status")
    .eq("org_id", orgId)
    .eq("provider", provider)
    .eq("owner_type", "org")
    .maybeSingle()

  if (error) throw error

  if (!data || data.status !== "active") {
    throw new ConnectionError(
      provider,
      (data?.status as "reconnect_required" | "revoked" | undefined) ?? "missing"
    )
  }

  return {
    orgConnectionId: data.id,
    connectionId: data.nango_connection_id,
    provider,
  }
}
