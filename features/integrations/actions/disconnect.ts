"use server"

import { getServerAuth } from "@/lib/auth"
import { getNango } from "@/lib/integrations/nango"
import { getProvider, isProviderId } from "@/lib/integrations/providers"
import { createAdminClient } from "@/lib/supabase/admin"

export type DisconnectResult =
  | { success: true }
  | { success: false; error: string }

export async function disconnectIntegration(
  providerParam: string
): Promise<DisconnectResult> {
  const { appUser } = await getServerAuth()
  if (!appUser) {
    return { success: false, error: "Unauthorized" }
  }
  if (appUser.role !== "admin") {
    return { success: false, error: "Forbidden" }
  }
  if (!isProviderId(providerParam)) {
    return { success: false, error: "Invalid provider" }
  }

  const provider = getProvider(providerParam)!
  const supabase = createAdminClient()

  const { data: row, error: fetchError } = await supabase
    .from("org_connections")
    .select("id, nango_connection_id")
    .eq("org_id", appUser.orgId)
    .eq("provider", providerParam)
    .eq("owner_type", provider.ownerTypeDefault)
    .maybeSingle()

  if (fetchError) {
    return { success: false, error: fetchError.message }
  }
  if (!row) {
    return { success: false, error: "No connection found" }
  }

  try {
    await getNango().deleteConnection(
      provider.nangoIntegrationId,
      row.nango_connection_id
    )
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Failed to delete Nango connection"
    return { success: false, error: message }
  }

  const { error: deleteError } = await supabase
    .from("org_connections")
    .delete()
    .eq("id", row.id)
    .eq("org_id", appUser.orgId)

  if (deleteError) {
    return { success: false, error: deleteError.message }
  }

  return { success: true }
}
