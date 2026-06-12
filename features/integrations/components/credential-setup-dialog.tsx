"use client"

import { useEffect, useState } from "react"

import { useServerAction } from "@/lib/hooks/use-server-action"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { saveCredentials } from "@/features/integrations/actions/save-credentials"
import { CredentialForm } from "@/features/integrations/components/credential-form"
import { useConnectProvider } from "@/features/integrations/hooks/use-connect-provider"
import type { ProviderState } from "@/features/integrations/types"

type CredentialSetupDialogProps = {
  provider: ProviderState | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: () => void
}

const CREDENTIAL_DESCRIPTION =
  "Bring your own Google OAuth app (Internal). Credentials are stored securely and never shown again after save."

type CredentialSetupFormProps = {
  provider: ProviderState
  onOpenChange: (open: boolean) => void
  onSaved: () => void
  onPendingChange: (pending: boolean) => void
}

function CredentialSetupForm({
  provider,
  onOpenChange,
  onSaved,
  onPendingChange,
}: CredentialSetupFormProps) {
  const { connect } = useConnectProvider()
  const { execute, pending } = useServerAction(saveCredentials, {
    successMessage: "OAuth credentials saved",
  })

  useEffect(() => {
    onPendingChange(pending)
  }, [pending, onPendingChange])

  const saveCredentialsForProvider = async (values: {
    clientId: string
    clientSecret: string
  }) => {
    return execute({
      provider: provider.id,
      clientId: values.clientId,
      clientSecret: values.clientSecret,
    })
  }

  const handleSave = async (values: {
    clientId: string
    clientSecret: string
  }) => {
    const result = await saveCredentialsForProvider(values)
    if (!result?.success) {
      return
    }

    onOpenChange(false)
    onSaved()
  }

  const handleSaveAndConnect = async (values: {
    clientId: string
    clientSecret: string
  }) => {
    const result = await saveCredentialsForProvider(values)
    if (!result?.success) {
      return
    }

    onOpenChange(false)
    onSaved()
    void connect({ ...provider, hasCredentials: true })
  }

  return (
    <CredentialForm
      provider={provider}
      pending={pending}
      onSubmit={(values) => void handleSave(values)}
      onCancel={() => onOpenChange(false)}
      onSaveAndConnect={(values) => void handleSaveAndConnect(values)}
    />
  )
}

export function CredentialSetupDialog({
  provider,
  open,
  onOpenChange,
  onSaved,
}: CredentialSetupDialogProps) {
  const [pending, setPending] = useState(false)

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen && pending) {
      return
    }
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        onInteractOutside={(event) => {
          if (pending) {
            event.preventDefault()
          }
        }}
        onEscapeKeyDown={(event) => {
          if (pending) {
            event.preventDefault()
          }
        }}
      >
        <DialogHeader className="mt-3 gap-2">
          <DialogTitle>
            {provider ? `${provider.label} setup` : "Integration setup"}
          </DialogTitle>
          <DialogDescription>{CREDENTIAL_DESCRIPTION}</DialogDescription>
        </DialogHeader>

        {open && provider ? (
          <CredentialSetupForm
            key={provider.id}
            provider={provider}
            onOpenChange={handleOpenChange}
            onSaved={onSaved}
            onPendingChange={setPending}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
