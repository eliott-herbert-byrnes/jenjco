import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { UsersView } from "@/features/organisation/users/components/users-view"
import type { OrgUserRow } from "@/features/organisation/users/types"
import { getServerAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { Header } from "@/components/header"

export const metadata: Metadata = { title: "Users" }

export default async function OrganisationUsersPage() {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)
  if (appUser.role !== "admin") redirect(paths.dashboard)

  const supabase = await createClient()

  const { data: rows, error } = await supabase
    .from("users")
    .select(
      "id, email, role, display_name, is_active, invited_at, created_at"
    )
    .eq("org_id", appUser.orgId)
    .order("created_at")

  if (error) {
    throw new Error(error.message)
  }

  const users = (rows ?? []) as OrgUserRow[]

  return (
    <>
      <Header
        page="Users"
        description="Invite teammates and manage roles for your organisation"
      />
      <div className="flex flex-col gap-6 p-6">

        <UsersView users={users} currentUserId={appUser.id} />
      </div>
    </>
  )
}
