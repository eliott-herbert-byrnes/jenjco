import type { AppUser } from "@/lib/auth/types"
import { createAdminClient } from "@/lib/supabase/admin"
import type { ProviderConfig, ProviderId } from "@/lib/integrations/providers"

export type ProviderCredentials = {
  clientId: string
  clientSecret: string
}

export async function getProviderCredentials(
  orgId: string,
  provider: ProviderId
): Promise<ProviderCredentials | null> {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from("org_provider_credentials")
    .select("client_id, client_secret")
    .eq("org_id", orgId)
    .eq("provider", provider)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    clientId: data.client_id,
    clientSecret: data.client_secret,
  }
}

export function buildSessionOverrides(
  provider: ProviderConfig,
  creds: ProviderCredentials
) {
  return {
    integrations_config_defaults: {
      [provider.nangoIntegrationId]: {
        connection_config: {
          oauth_client_id_override: creds.clientId,
          oauth_client_secret_override: creds.clientSecret,
        },
      },
    },
  }
}

export function buildConnectTags(orgId: string, appUser: AppUser) {
  return {
    organization_id: orgId,
    end_user_id: appUser.id,
    end_user_email: appUser.email,
  }
}
