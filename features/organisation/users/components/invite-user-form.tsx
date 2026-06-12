"use client"

import { useState } from "react"
import { CopyIcon } from "lucide-react"
import { toast } from "sonner"

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
  const [inviteLink, setInviteLink] = useState<string | null>(null)

  const { execute, pending } = useServerAction(inviteUser, {
    onSuccess: (result) => {
      if (result.emailError) {
        toast.warning("Invite created — email failed, copy the link below")
        setInviteLink(result.inviteLink ?? null)
      } else {
        toast.success("Invite email sent")
        setInviteLink(null)
      }
      setEmail("")
      setDisplayName("")
      setRole("viewer")
      onSuccess()
    },
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    setInviteLink(null)
    void execute({
      email: email.trim(),
      role,
      displayName: displayName.trim() || undefined,
    })
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
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Invite user</CardTitle>
          <CardDescription>
            Send an invite email with a link to join your organization.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
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
                {pending ? "Sending invite…" : "Send invite"}
              </Button>
            </FieldGroup>
          </form>

        </CardContent>
      </Card>

          {inviteLink ? (
            <div className="mt-0 flex flex-col gap-2 rounded-2xl border border-destructive/50 bg-destructive/10 p-4">
              <p className="text-sm font-medium text-destructive">Invite link</p>
              <FieldDescription>
                Email delivery failed. Share this link manually instead.
              </FieldDescription>
              <p className="break-all text-sm text-muted-foreground">
                {inviteLink}
              </p>
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
    </>
  )
}
