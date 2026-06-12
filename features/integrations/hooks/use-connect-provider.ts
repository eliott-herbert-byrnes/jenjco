"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { apiPaths, paths } from "@/app/paths"
import { openNangoConnect } from "@/features/integrations/lib/nango-connect"
import type { ProviderState } from "@/features/integrations/types"

export function useConnectProvider() {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  const connect = useCallback(
    async (provider: ProviderState) => {
      setPending(true)
      let dismissConnect = () => {}

      try {
        const needsReconnect = provider.status === "reconnect_required"

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
    },
    [router]
  )

  return { connect, pending }
}
