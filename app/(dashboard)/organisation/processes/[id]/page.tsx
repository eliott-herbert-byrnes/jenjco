import { Suspense } from "react"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { ProcessDetailSection } from "@/features/processes/components/process-detail-section"
import { ProcessDetailSkeleton } from "@/features/processes/components/process-detail-skeleton"
import { getServerAuth } from "@/lib/auth"

export default async function ProcessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)

  return (
    <Suspense fallback={<ProcessDetailSkeleton />}>
      <ProcessDetailSection
        id={id}
        orgId={appUser.orgId}
        role={appUser.role}
      />
    </Suspense>
  )
}
