"use client"

import { useRouter } from "next/navigation"
import type { OrgUserRow } from "@/features/organisation/users/types"
import { InviteUserForm } from "./invite-user-form"
import { UsersTable } from "./users-table"

type UsersViewProps = {
  users: OrgUserRow[]
  currentUserId: string
}

export function UsersView({ users, currentUserId }: UsersViewProps) {
  const router = useRouter()

  const handleMutationSuccess = () => {
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <InviteUserForm onSuccess={handleMutationSuccess} />
      <UsersTable
        users={users}
        currentUserId={currentUserId}
        onMutationSuccess={handleMutationSuccess}
      />
    </div>
  )
}
