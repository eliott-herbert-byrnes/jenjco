"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ProviderState } from "@/features/integrations/types"
import { BRAND_BADGE_CLASSES } from "@/lib/brand-colors"
import { PROVIDERS } from "@/lib/integrations/providers"

type SetupProviderCardProps = {
  provider: ProviderState
  onSelect: (provider: ProviderState) => void
}

function credentialBadge(provider: ProviderState) {
  return provider.hasCredentials ? (
    <Badge className={BRAND_BADGE_CLASSES.emerald}>Configured</Badge>
  ) : (
    <Badge variant="outline">Not configured</Badge>
  )
}

export function SetupProviderCard({
  provider,
  onSelect,
}: SetupProviderCardProps) {
  const Icon = PROVIDERS[provider.id].icon

  return (
    <Card className="w-full transition-all duration-200 ease-in-out hover:scale-101">
      <button
        type="button"
        className="w-full text-left"
        onClick={() => onSelect(provider)}
      >
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <div className="bg-neutral-200 p-1.5 rounded-2xl border border-neutral-300">
                <Icon className="size-5" aria-hidden />
              </div>
              {provider.label}
            </CardTitle>
            {credentialBadge(provider)}
          </div>
          <CardDescription>Configure OAuth credentials</CardDescription>
        </CardHeader>
      </button>
    </Card>
  )
}
