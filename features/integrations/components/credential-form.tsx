"use client"

import { useState } from "react"
import { toast } from "sonner"

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
  const [pending, setPending] = useState(false)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setPending(true)

    const result = await saveCredentials({
      provider: provider.id,
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
    })

    setPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("OAuth credentials saved")
    setClientId("")
    setClientSecret("")
    onSaved()
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
        <form onSubmit={(event) => void handleSubmit(event)}>
          <FieldGroup>
            {provider.hasCredentials ? (
              <p className="text-sm text-muted-foreground">
                Credentials are configured for {provider.label}. Enter new
                values below to replace them.
              </p>
            ) : null}
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
