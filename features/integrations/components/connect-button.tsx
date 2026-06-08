"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { apiPaths, paths } from "@/app/paths"
import { Button } from "@/components/ui/button"
import { openNangoConnect } from "@/features/integrations/lib/nango-connect"
import type { ProviderState } from "@/features/integrations/types"

type ConnectButtonProps = {
  provider: ProviderState
}

export function ConnectButton({ provider }: ConnectButtonProps) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const needsReconnect = provider.status === "reconnect_required"
  const isConnected = provider.status === "active"
  const label = needsReconnect ? "Reconnect" : "Connect"

  const handleConnect = async () => {
    if (!provider.hasCredentials) {
      toast.error("Save OAuth credentials before connecting")
      return
    }

    setPending(true)
    let dismissConnect = () => {}

    try {
      const connectRes = await fetch(apiPaths.integrationConnect(provider.id), {
        method: "POST",
      })
      const connectBody = (await connectRes.json()) as {
        sessionToken?: string
        error?: string
      }

      if (!connectRes.ok || !connectBody.sessionToken) {
        throw new Error(connectBody.error ?? "Failed to start connect session")
      }

      await new Promise<void>((resolve, reject) => {
        const session = openNangoConnect({
          sessionToken: connectBody.sessionToken!,
          onSuccess: async () => {
            try {
              const completeRes = await fetch(
                apiPaths.integrationComplete(provider.id),
                { method: "POST" }
              )
              const completeBody = (await completeRes.json()) as {
                error?: string
              }

              if (!completeRes.ok) {
                throw new Error(
                  completeBody.error ?? "Failed to complete connection"
                )
              }

              toast.success(
                needsReconnect
                  ? `${provider.label} reconnected`
                  : `${provider.label} connected`
              )
              router.replace(paths.integrations)
              router.refresh()
              resolve()
            } catch (err) {
              reject(err)
            }
          },
          onError: (message) => {
            reject(new Error(message))
          },
          onClose: () => {
            resolve()
          },
        })
        dismissConnect = session.dismiss
      })
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Connection failed"
      toast.error(message)
    } finally {
      dismissConnect()
      setPending(false)
    }
  }

  if (isConnected) {
    return null
  }

  return (
    <Button
      type="button"
      disabled={pending || !provider.hasCredentials}
      onClick={() => void handleConnect()}
    >
      {pending ? "Connecting…" : label}
    </Button>
  )
}
