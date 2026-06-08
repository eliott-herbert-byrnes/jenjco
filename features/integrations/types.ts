import type { ProviderId } from "@/lib/integrations/providers"

export type ConnectionStatus = "active" | "reconnect_required" | "revoked"

export type ProviderState = {
  id: ProviderId
  label: string
  status: ConnectionStatus | null
  hasCredentials: boolean
}
