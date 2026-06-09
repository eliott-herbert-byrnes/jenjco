"use client"

import { useState } from "react"
import { MoreHorizontalIcon } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { deactivateUser } from "@/features/organisation/users/actions/deactivate-user"
import { reactivateUser } from "@/features/organisation/users/actions/reactivate-user"
import { removeUser } from "@/features/organisation/users/actions/remove-user"
import type { OrgUserRow } from "@/features/organisation/users/types"

type PendingAction = "deactivate" | "reactivate" | "remove" | null

type UserActionsMenuProps = {
  user: OrgUserRow
  onSuccess: () => void
}

export function UserActionsMenu({ user, onSuccess }: UserActionsMenuProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction>(null)
  const [actionPending, setActionPending] = useState(false)

  const displayLabel = user.display_name ?? user.email

  const runAction = async () => {
    if (!pendingAction) return

    setActionPending(true)

    const result =
      pendingAction === "deactivate"
        ? await deactivateUser({ userId: user.id })
        : pendingAction === "reactivate"
          ? await reactivateUser({ userId: user.id })
          : await removeUser({ userId: user.id })

    setActionPending(false)

    if (!result.success) {
      toast.error(result.error)
      return
    }

    const successMessage =
      pendingAction === "deactivate"
        ? `${displayLabel} deactivated`
        : pendingAction === "reactivate"
          ? `${displayLabel} reactivated`
          : `${displayLabel} removed`

    toast.success(successMessage)
    setPendingAction(null)
    onSuccess()
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button type="button" variant="ghost" size="icon-sm">
            <MoreHorizontalIcon />
            <span className="sr-only">User actions</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {user.is_active ? (
            <DropdownMenuItem onSelect={() => setPendingAction("deactivate")}>
              Deactivate
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => setPendingAction("reactivate")}>
              Reactivate
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onSelect={() => setPendingAction("remove")}
          >
            Remove
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog
        open={pendingAction === "deactivate"}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate {displayLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              User will be signed out and cannot sign in until reactivated.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={actionPending}
              onClick={() => void runAction()}
            >
              {actionPending ? "Deactivating…" : "Deactivate"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingAction === "reactivate"}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reactivate {displayLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              The user will be able to sign in again. They will need to use their
              existing credentials or a new invite link.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionPending}>Cancel</AlertDialogCancel>
            <Button disabled={actionPending} onClick={() => void runAction()}>
              {actionPending ? "Reactivating…" : "Reactivate"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={pendingAction === "remove"}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {displayLabel}?</AlertDialogTitle>
            <AlertDialogDescription>
              Permanently deletes account and conversation history. This cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionPending}>Cancel</AlertDialogCancel>
            <Button
              variant="destructive"
              disabled={actionPending}
              onClick={() => void runAction()}
            >
              {actionPending ? "Removing…" : "Remove user"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
