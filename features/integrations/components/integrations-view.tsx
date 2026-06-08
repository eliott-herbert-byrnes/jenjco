"use client"

import { useRouter } from "next/navigation"

import { CredentialForm } from "@/features/integrations/components/credential-form"
import { ProviderCard } from "@/features/integrations/components/provider-card"
import type { ProviderState } from "@/features/integrations/types"

type IntegrationsViewProps = {
  providers: ProviderState[]
}

export function IntegrationsView({ providers }: IntegrationsViewProps) {
  const router = useRouter()

  const handleCredentialsSaved = () => {
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-4">
        <h2 className="text-sm font-medium">Connected services</h2>
        {providers.map((provider) => (
          <ProviderCard key={provider.id} provider={provider} />
        ))}
      </section>

      {providers.map((provider) => (
        <section key={`${provider.id}-credentials`} className="flex flex-col gap-4">
          <h2 className="text-sm font-medium">{provider.label} setup</h2>
          <CredentialForm
            provider={provider}
            onSaved={handleCredentialsSaved}
          />
        </section>
      ))}
    </div>
  )
}
