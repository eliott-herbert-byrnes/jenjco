import { Suspense } from "react"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { Header } from "@/components/header"
import { WorkflowDetailSection } from "@/features/workflows/components/workflow-detail-section"
import { WorkflowDetailSkeleton } from "@/features/workflows/components/workflow-detail-skeleton"
import { getServerAuth } from "@/lib/auth"

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)

  return (
    <>
      <Header
        page="Workflows"
        description="Execute, manage, and troubleshoot workflows"
      />
      <Suspense fallback={<WorkflowDetailSkeleton />}>
        <WorkflowDetailSection
          id={id}
          orgId={appUser.orgId}
          role={appUser.role}
        />
      </Suspense>
    </>
  )
}
