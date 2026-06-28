import { IntegrationsView } from "@/features/integrations/components/integrations-view"
import type {
  ConnectionStatus,
  ProviderState,
} from "@/features/integrations/types"
import { PROVIDERS, type ProviderId } from "@/lib/integrations/providers"
import { createClient } from "@/lib/supabase/server"

function isConnectionStatus(value: string): value is ConnectionStatus {
  return (
    value === "active" ||
    value === "reconnect_required" ||
    value === "revoked"
  )
}

type IntegrationsPageSectionProps = {
  orgId: string
}

export async function IntegrationsPageSection({
  orgId,
}: IntegrationsPageSectionProps) {
  const providerIds = Object.keys(PROVIDERS) as ProviderId[]
  const supabase = await createClient()

  const [{ data: connections }, { data: credentialRows }] = await Promise.all([
    supabase
      .from("org_connections")
      .select("provider, status")
      .eq("org_id", orgId)
      .in("provider", providerIds),
    supabase
      .from("org_provider_credentials")
      .select("provider")
      .eq("org_id", orgId)
      .in("provider", providerIds),
  ])

  const statusByProvider = new Map<string, ConnectionStatus>()
  for (const row of connections ?? []) {
    if (isConnectionStatus(row.status)) {
      statusByProvider.set(row.provider, row.status)
    }
  }

  const credProviders = new Set(
    (credentialRows ?? []).map((row) => row.provider)
  )

  const providers: ProviderState[] = Object.values(PROVIDERS).map(
    (provider) => ({
      id: provider.id,
      label: provider.label,
      status: statusByProvider.get(provider.id) ?? null,
      hasCredentials: credProviders.has(provider.id),
    })
  )

  return <IntegrationsView providers={providers} />
}
