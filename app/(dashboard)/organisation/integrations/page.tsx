import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { IntegrationsView } from "@/features/integrations/components/integrations-view"
import type {
  ConnectionStatus,
  ProviderState,
} from "@/features/integrations/types"
import { getServerAuth } from "@/lib/auth"
import { PROVIDERS, type ProviderId } from "@/lib/integrations/providers"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"

export const metadata: Metadata = { title: "Integrations" }

function isConnectionStatus(value: string): value is ConnectionStatus {
  return (
    value === "active" ||
    value === "reconnect_required" ||
    value === "revoked"
  )
}

export default async function IntegrationsPage() {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)
  if (appUser.role !== "admin") redirect(paths.dashboard)

  const providerIds = Object.keys(PROVIDERS) as ProviderId[]
  const supabase = await createClient()

  const [{ data: connections }, { data: credentialRows }] = await Promise.all([
    supabase
      .from("org_connections")
      .select("provider, status")
      .eq("org_id", appUser.orgId)
      .in("provider", providerIds),
    supabase
      .from("org_provider_credentials")
      .select("provider")
      .eq("org_id", appUser.orgId)
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

  return (
    <>
      <Header
        page="Integrations"
        description="Connect external services for your organisation"
        />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">

      <IntegrationsView providers={providers} />
      </div>
        </>
  )
}
