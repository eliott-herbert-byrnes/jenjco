import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { Header } from "@/components/header"
import { WorkflowHubSection } from "@/features/workflows/components/workflow-hub-section"
import { WorkflowHubSkeleton } from "@/features/workflows/components/workflow-hub-skeleton"
import { getServerAuth } from "@/lib/auth"

export const metadata: Metadata = {
  title: "Workflows",
}

export default async function WorkflowsHubPage() {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)

  return (
    <>
      <Header
        page="Workflows"
        description="Execute, manage, and troubleshoot workflows"
      />
      <Suspense fallback={<WorkflowHubSkeleton />}>
        <WorkflowHubSection
          orgId={appUser.orgId}
          isAdmin={appUser.role === "admin"}
        />
      </Suspense>
    </>
  )
}
