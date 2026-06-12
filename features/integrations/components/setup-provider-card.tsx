"use client"

import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { ProviderState } from "@/features/integrations/types"

type SetupProviderCardProps = {
  provider: ProviderState
  onSelect: (provider: ProviderState) => void
}

function credentialBadge(provider: ProviderState) {
  return provider.hasCredentials ? (
    <Badge variant="secondary">Configured</Badge>
  ) : (
    <Badge variant="outline">Not configured</Badge>
  )
}

export function SetupProviderCard({
  provider,
  onSelect,
}: SetupProviderCardProps) {
  return (
    <Card className="w-full transition-all duration-200 ease-in-out hover:scale-101">
      <button
        type="button"
        className="w-full text-left"
        onClick={() => onSelect(provider)}
      >
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">{provider.label}</CardTitle>
            {credentialBadge(provider)}
          </div>
          <CardDescription>Configure OAuth credentials</CardDescription>
        </CardHeader>
      </button>
    </Card>
  )
}
