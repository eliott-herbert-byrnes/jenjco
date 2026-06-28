import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { Header } from "@/components/header"
import { IntegrationsPageSection } from "@/features/integrations/components/integrations-page-section"
import { IntegrationsPageSkeleton } from "@/features/integrations/components/integrations-page-skeleton"
import { getServerAuth } from "@/lib/auth"

export const metadata: Metadata = { title: "Integrations" }

export default async function IntegrationsPage() {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)
  if (appUser.role !== "admin") redirect(paths.dashboard)

  return (
    <>
      <Header
        page="Integrations"
        description="Connect external services for your organisation"
      />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
        <Suspense fallback={<IntegrationsPageSkeleton />}>
          <IntegrationsPageSection orgId={appUser.orgId} />
        </Suspense>
      </div>
    </>
  )
}
