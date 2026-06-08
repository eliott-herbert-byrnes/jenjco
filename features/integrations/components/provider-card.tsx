"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { disconnectIntegration } from "@/features/integrations/actions/disconnect"
import { ConnectButton } from "@/features/integrations/components/connect-button"
import type { ProviderState } from "@/features/integrations/types"

function statusBadge(provider: ProviderState) {
  switch (provider.status) {
    case "active":
      return <Badge variant="secondary">Connected</Badge>
    case "reconnect_required":
      return <Badge variant="destructive">Reconnect required</Badge>
    case "revoked":
      return <Badge variant="outline">Revoked</Badge>
    default:
      return <Badge variant="outline">Not connected</Badge>
  }
}

type ProviderCardProps = {
  provider: ProviderState
}

export function ProviderCard({ provider }: ProviderCardProps) {
  const router = useRouter()
  const [disconnectOpen, setDisconnectOpen] = useState(false)
  const [disconnectPending, setDisconnectPending] = useState(false)

  const handleDisconnect = async () => {
    setDisconnectPending(true)
    const result = await disconnectIntegration(provider.id)
    setDisconnectPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success(`${provider.label} disconnected`)
    setDisconnectOpen(false)
    router.refresh()
  }

  const showDisconnect =
    provider.status === "active" || provider.status === "reconnect_required"

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">{provider.label}</CardTitle>
          {statusBadge(provider)}
        </div>
        <CardDescription>
          Org-wide connection for agents and workflows
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <ConnectButton provider={provider} />
        {showDisconnect ? (
          <AlertDialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline">
                Disconnect
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  Disconnect {provider.label}?
                </AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the connection from Nango and your organisation.
                  Agents and workflows will no longer access {provider.label}.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={disconnectPending}>
                  Cancel
                </AlertDialogCancel>
                <Button
                  variant="destructive"
                  disabled={disconnectPending}
                  onClick={() => void handleDisconnect()}
                >
                  {disconnectPending ? "Disconnecting…" : "Disconnect"}
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : null}
        {!provider.hasCredentials ? (
          <p className="w-full text-sm text-muted-foreground">
            Save OAuth credentials below before connecting.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
