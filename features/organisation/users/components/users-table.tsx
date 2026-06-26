"use client"

import { useState } from "react"
import { PencilIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { EditUserDialog } from "@/features/organisation/users/components/edit-user-dialog"
import { UserActionsMenu } from "@/features/organisation/users/components/user-actions-menu"
import type { OrgUserRow } from "@/features/organisation/users/types"
import { BRAND_BADGE_CLASSES } from "@/lib/brand-colors"

type UsersTableProps = {
  users: OrgUserRow[]
  currentUserId: string
  onMutationSuccess: () => void
}

function roleBadge(role: OrgUserRow["role"]) {
  return (
    <Badge
      className={
        role === "admin"
          ? BRAND_BADGE_CLASSES.orange
          : BRAND_BADGE_CLASSES.sky
      }
    >
      {role === "admin" ? "Admin" : "Viewer"}
    </Badge>
  )
}

function statusBadge(isActive: boolean) {
  return isActive ? (
    <Badge className={BRAND_BADGE_CLASSES.emerald}>Active</Badge>
  ) : (
    <Badge variant="outline">Inactive</Badge>
  )
}

export function UsersTable({
  users,
  currentUserId,
  onMutationSuccess,
}: UsersTableProps) {
  const [editingUser, setEditingUser] = useState<OrgUserRow | null>(null)

  if (!users.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No users yet — invite someone to get started.
      </p>
    )
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Team members</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50">
              <tr>
                {["Name", "Email", "Role", "Status", "Joined", ""].map(
                  (heading) => (
                    <th
                      key={heading || "actions"}
                      className="px-4 py-2 text-left font-medium text-muted-foreground last:text-right"
                    >
                      {heading}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isSelf = user.id === currentUserId

                return (
                  <tr
                    key={user.id}
                    className="border-b last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-4 py-2 font-medium">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold">
                          {(user.display_name ?? user.email)
                            .charAt(0)
                            .toUpperCase()}
                        </span>
                        <span>
                          {user.display_name ?? "—"}
                          {isSelf ? (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (you)
                            </span>
                          ) : null}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {user.email}
                    </td>
                    <td className="px-4 py-2">{roleBadge(user.role)}</td>
                    <td className="px-4 py-2">
                      {statusBadge(user.is_active)}
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setEditingUser(user)}
                        >
                          <PencilIcon />
                          <span className="sr-only">Edit {user.email}</span>
                        </Button>
                        <UserActionsMenu
                          user={user}
                          onSuccess={onMutationSuccess}
                        />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <EditUserDialog
        user={editingUser}
        open={editingUser !== null}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null)
        }}
        onSuccess={onMutationSuccess}
      />
    </>
  )
}
