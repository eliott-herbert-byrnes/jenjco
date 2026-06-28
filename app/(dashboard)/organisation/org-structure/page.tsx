import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { Header } from "@/components/header"
import { OrgStructureSection } from "@/features/org-structure/components/org-structure-section"
import { OrgStructureSkeleton } from "@/features/org-structure/components/org-structure-skeleton"
import { getServerAuth } from "@/lib/auth"

export const metadata: Metadata = { title: "Org Structure" }

export default async function OrgStructurePage() {
  const { appUser, organization } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)

  return (
    <div className="flex h-[calc(100vh-5rem)] w-full flex-col">
      <Header
        page="Organisation"
        description="Get a high level overview of your organisation"
      />
      <Suspense fallback={<OrgStructureSkeleton />}>
        <OrgStructureSection
          orgId={appUser.orgId}
          orgName={organization?.name ?? "Organisation"}
        />
      </Suspense>
    </div>
  )
}
