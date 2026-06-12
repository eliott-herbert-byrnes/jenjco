"use client"

import { useState } from "react"

import { useServerAction } from "@/lib/hooks/use-server-action"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { saveCredentials } from "@/features/integrations/actions/save-credentials"
import type { ProviderState } from "@/features/integrations/types"

type CredentialFormProps = {
  provider: ProviderState
  onSaved: () => void
}

export function CredentialForm({ provider, onSaved }: CredentialFormProps) {
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")

  const { execute, pending } = useServerAction(saveCredentials, {
    successMessage: "OAuth credentials saved",
    onSuccess: () => {
      setClientId("")
      setClientSecret("")
      onSaved()
    },
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void execute({
      provider: provider.id,
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">OAuth credentials</CardTitle>
        <CardDescription>
          Bring your own Google OAuth app (Internal). Credentials are stored
          securely and never shown again after save.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
              <FieldDescription>
                Used only when starting a Connect or Reconnect session.
              </FieldDescription>
            </Field>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : "Save credentials"}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
