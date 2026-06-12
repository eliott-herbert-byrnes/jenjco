"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

import { CredentialSetupDialog } from "@/features/integrations/components/credential-setup-dialog"
import { ProviderCard } from "@/features/integrations/components/provider-card"
import { SetupProviderCard } from "@/features/integrations/components/setup-provider-card"
import type { ProviderState } from "@/features/integrations/types"

type IntegrationsViewProps = {
  providers: ProviderState[]
}

export function IntegrationsView({ providers }: IntegrationsViewProps) {
  const router = useRouter()
  const [setupProvider, setSetupProvider] = useState<ProviderState | null>(
    null
  )
  const [dialogOpen, setDialogOpen] = useState(false)

  const openSetup = (provider: ProviderState) => {
    setSetupProvider(provider)
    setDialogOpen(true)
  }

  const connectedProviders = providers.filter((p) => p.status !== null)
  const setupProviders = providers

  const handleCredentialsSaved = () => {
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium">Connected services</h2>
        {connectedProviders.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No services connected yet. Configure credentials below, then
            connect.
          </p>
        ) : (
          connectedProviders.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              onSetupClick={() => openSetup(provider)}
            />
          ))
        )}
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium">Integration setup</h2>
        <div className="flex flex-row w-full">
          {setupProviders.map((provider) => (
            <SetupProviderCard
              key={provider.id}
              provider={provider}
              onSelect={openSetup}
            />
          ))}
        </div>
      </section>

      <CredentialSetupDialog
        provider={setupProvider}
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) setSetupProvider(null)
        }}
        onSaved={handleCredentialsSaved}
      />
    </div>
  )
}
