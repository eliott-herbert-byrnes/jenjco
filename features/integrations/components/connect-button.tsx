"use client"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { useConnectProvider } from "@/features/integrations/hooks/use-connect-provider"
import type { ProviderState } from "@/features/integrations/types"

type ConnectButtonProps = {
  provider: ProviderState
  onMissingCredentials?: () => void
}

export function ConnectButton({
  provider,
  onMissingCredentials,
}: ConnectButtonProps) {
  const { connect, pending } = useConnectProvider()

  const needsReconnect = provider.status === "reconnect_required"
  const isConnected = provider.status === "active"
  const label = needsReconnect ? "Reconnect" : "Connect"

  const handleConnect = () => {
    if (!provider.hasCredentials) {
      if (onMissingCredentials) {
        onMissingCredentials()
        return
      }
      toast.error("Save OAuth credentials before connecting")
      return
    }

    void connect(provider)
  }

  if (isConnected) {
    return null
  }

  return (
    <Button
      type="button"
      disabled={pending}
      onClick={handleConnect}
    >
      {pending ? "Connecting…" : label}
    </Button>
  )
}
