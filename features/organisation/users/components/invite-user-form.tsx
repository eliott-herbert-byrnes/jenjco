"use client"

import { useState } from "react"
import { CopyIcon } from "lucide-react"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { inviteUser } from "@/features/organisation/users/actions/invite-user"

type InviteUserFormProps = {
  onSuccess: () => void
}

export function InviteUserForm({ onSuccess }: InviteUserFormProps) {
  const [email, setEmail] = useState("")
  const [role, setRole] = useState<"admin" | "viewer">("viewer")
  const [displayName, setDisplayName] = useState("")
  const [pending, setPending] = useState(false)
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setPending(true)
    setInviteLink(null)

    const result = await inviteUser({
      email: email.trim(),
      role,
      displayName: displayName.trim() || undefined,
    })

    setPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    toast.success("Invite created — copy the link below")
    setInviteLink(result.inviteLink ?? null)
    setEmail("")
    setDisplayName("")
    setRole("viewer")
    onSuccess()
  }

  const handleCopyLink = async () => {
    if (!inviteLink) return

    try {
      await navigator.clipboard.writeText(inviteLink)
      toast.success("Invite link copied")
    } catch {
      toast.error("Could not copy link")
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Invite user</CardTitle>
        <CardDescription>
          Generate an invite link to share manually — no email is sent from this
          app.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={(event) => void handleSubmit(event)}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="invite-email">Email</FieldLabel>
              <Input
                id="invite-email"
                name="email"
                type="email"
                autoComplete="off"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="colleague@company.com"
                required
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="invite-role">Role</FieldLabel>
              <Select
                value={role}
                onValueChange={(value) =>
                  setRole(value as "admin" | "viewer")
                }
              >
                <SelectTrigger id="invite-role" className="w-full">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="viewer">Viewer</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="invite-display-name">
                Display name (optional)
              </FieldLabel>
              <Input
                id="invite-display-name"
                name="displayName"
                autoComplete="off"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                placeholder="Jane Smith"
              />
            </Field>
            <Button type="submit" disabled={pending}>
              {pending ? "Creating invite…" : "Create invite link"}
            </Button>
          </FieldGroup>
        </form>

        {inviteLink ? (
          <div className="mt-6 flex flex-col gap-2 rounded-2xl border bg-muted/30 p-4">
            <p className="text-sm font-medium">Invite link</p>
            <p className="break-all text-sm text-muted-foreground">
              {inviteLink}
            </p>
            <FieldDescription>
              Share this link with the invitee. It expires per your Supabase Auth
              settings.
            </FieldDescription>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => void handleCopyLink()}
            >
              <CopyIcon />
              Copy link
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}
