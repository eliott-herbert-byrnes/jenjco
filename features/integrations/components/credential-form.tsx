"use client"

import { useState } from "react"

import { Button } from "@/components/ui/button"
import { DialogFooter } from "@/components/ui/dialog"
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { ProviderState } from "@/features/integrations/types"

type CredentialFormProps = {
  provider: ProviderState
  pending?: boolean
  onSubmit: (values: { clientId: string; clientSecret: string }) => void
  onCancel: () => void
  onSaveAndConnect?: (values: { clientId: string; clientSecret: string }) => void
  showSaveAndConnect?: boolean
}

export function CredentialForm({
  provider,
  pending = false,
  onSubmit,
  onCancel,
  onSaveAndConnect,
  showSaveAndConnect,
}: CredentialFormProps) {
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")

  const showConnectAction =
    showSaveAndConnect ?? provider.status !== "active"

  const getValues = () => ({
    clientId: clientId.trim(),
    clientSecret: clientSecret.trim(),
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    onSubmit(getValues())
  }

  const handleSaveAndConnect = () => {
    const values = getValues()
    if (!values.clientId || !values.clientSecret) {
      return
    }
    onSaveAndConnect?.(values)
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor={`${provider.id}-client-id`}>
            Client ID
          </FieldLabel>
          <Input
            id={`${provider.id}-client-id`}
            name="clientId"
            autoComplete="off"
            value={clientId}
            onChange={(event) => setClientId(event.target.value)}
            placeholder={
              provider.hasCredentials ? "Enter new client ID" : "Client ID"
            }
            required
          />
        </Field>
        <Field>
          <FieldLabel htmlFor={`${provider.id}-client-secret`}>
            Client secret
          </FieldLabel>
          <Input
            id={`${provider.id}-client-secret`}
            name="clientSecret"
            type="password"
            autoComplete="new-password"
            value={clientSecret}
            onChange={(event) => setClientSecret(event.target.value)}
            placeholder={
              provider.hasCredentials
                ? "Enter new client secret"
                : "Client secret"
            }
            required
          />
        </Field>
      </FieldGroup>

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={onCancel}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save credentials"}
        </Button>
        {showConnectAction && onSaveAndConnect ? (
          <Button
            type="button"
            disabled={pending}
            onClick={handleSaveAndConnect}
          >
            {pending ? "Saving…" : "Save and connect"}
          </Button>
        ) : null}
      </DialogFooter>
    </form>
  )
}
