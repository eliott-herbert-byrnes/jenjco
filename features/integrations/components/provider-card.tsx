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
import { BRAND_BADGE_CLASSES } from "@/lib/brand-colors"
import { PROVIDERS } from "@/lib/integrations/providers"

function statusBadge(provider: ProviderState) {
  switch (provider.status) {
    case "active":
      return (
        <Badge className={BRAND_BADGE_CLASSES.emerald}>Connected</Badge>
      )
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
  onSetupClick?: () => void
}

export function ProviderCard({ provider, onSetupClick }: ProviderCardProps) {
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
  const Icon = PROVIDERS[provider.id].icon

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <div className="bg-neutral-200 p-1.5 rounded-2xl border border-neutral-300">
            <Icon className="size-5" aria-hidden />
            </div>
            {provider.label}
          </CardTitle>
          {statusBadge(provider)}
        </div>
        <CardDescription>
          Org-wide connection for agents and workflows
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <ConnectButton
          provider={provider}
          onMissingCredentials={onSetupClick}
        />
        {showDisconnect ? (
          <AlertDialog open={disconnectOpen} onOpenChange={setDisconnectOpen}>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="destructive">
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
            {onSetupClick ? (
              <>
                <Button
                  type="button"
                  variant="link"
                  className="h-auto p-0 text-sm"
                  onClick={onSetupClick}
                >
                  Configure credentials in Integration setup
                </Button>{" "}
                before connecting.
              </>
            ) : (
              "Save OAuth credentials before connecting."
            )}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
