import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { Header } from "@/components/header"
import { UsersSection } from "@/features/organisation/users/components/users-section"
import { UsersSkeleton } from "@/features/organisation/users/components/users-skeleton"
import { getServerAuth } from "@/lib/auth"

export const metadata: Metadata = { title: "Users" }

export default async function OrganisationUsersPage() {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)
  if (appUser.role !== "admin") redirect(paths.dashboard)

  return (
    <>
      <Header
        page="Users"
        description="Invite teammates and manage roles for your organisation"
      />
      <div className="flex flex-col gap-6 p-6">
        <Suspense fallback={<UsersSkeleton />}>
          <UsersSection orgId={appUser.orgId} currentUserId={appUser.id} />
        </Suspense>
      </div>
    </>
  )
}
