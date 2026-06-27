"use client"

import { useState } from "react"

import { useServerAction } from "@/lib/hooks/use-server-action"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Field,
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
import { updateUser } from "@/features/organisation/users/actions/update-user"
import type {
  DepartmentOption,
  OrgUserRow,
} from "@/features/organisation/users/types"

const NO_TEAM_VALUE = "__none__"

type EditUserDialogProps = {
  user: OrgUserRow | null
  departments: DepartmentOption[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

type EditUserFormProps = {
  user: OrgUserRow
  departments: DepartmentOption[]
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

function EditUserForm({
  user,
  departments,
  onOpenChange,
  onSuccess,
}: EditUserFormProps) {
  const [role, setRole] = useState<"admin" | "viewer">(user.role)
  const [displayName, setDisplayName] = useState(user.display_name ?? "")
  const [departmentId, setDepartmentId] = useState(
    user.department_id ?? NO_TEAM_VALUE
  )

  const { execute, pending } = useServerAction(updateUser, {
    successMessage: "User updated",
    onSuccess: () => {
      onOpenChange(false)
      onSuccess()
    },
  })

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    void execute({
      userId: user.id,
      role,
      displayName: displayName.trim() || null,
      ...(user.is_active
        ? {
            departmentId:
              departmentId === NO_TEAM_VALUE ? null : departmentId,
          }
        : {}),
    })
  }

  return (
    <form onSubmit={handleSubmit}>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="edit-email">Email</FieldLabel>
          <Input id="edit-email" value={user.email} readOnly disabled />
        </Field>
        <Field>
          <FieldLabel htmlFor="edit-display-name">Display name</FieldLabel>
          <Input
            id="edit-display-name"
            name="displayName"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Display name"
          />
        </Field>
        <Field>
          <FieldLabel htmlFor="edit-role">Role</FieldLabel>
          <Select
            value={role}
            onValueChange={(value) => setRole(value as "admin" | "viewer")}
          >
            <SelectTrigger id="edit-role" className="w-full">
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="viewer">Viewer</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        </Field>
        <Field>
          <FieldLabel htmlFor="edit-team">Team</FieldLabel>
          <Select
            value={departmentId}
            onValueChange={setDepartmentId}
            disabled={!user.is_active}
          >
            <SelectTrigger id="edit-team" className="w-full">
              <SelectValue placeholder="Select team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NO_TEAM_VALUE}>None</SelectItem>
              {departments.map((department) => (
                <SelectItem key={department.id} value={department.id}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!user.is_active ? (
            <p className="text-xs text-muted-foreground">
              Team can only be assigned when the user is active.
            </p>
          ) : null}
        </Field>
      </FieldGroup>

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function EditUserDialog({
  user,
  departments,
  open,
  onOpenChange,
  onSuccess,
}: EditUserDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit user</DialogTitle>
          <DialogDescription>
            Update role, team, and display name. Email cannot be changed here.
          </DialogDescription>
        </DialogHeader>

        {user ? (
          <EditUserForm
            key={user.id}
            user={user}
            departments={departments}
            onOpenChange={onOpenChange}
            onSuccess={onSuccess}
          />
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
