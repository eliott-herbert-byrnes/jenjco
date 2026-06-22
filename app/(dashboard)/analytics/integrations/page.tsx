import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { Header } from "@/components/header"
import { IntegrationsView } from "@/features/analytics/components/integrations-view"
import { getServerAuth } from "@/lib/auth"

export const metadata: Metadata = { title: "Analytics Integrations" }

type Props = {
  searchParams: Promise<{ page?: string }>
}

export default async function AnalyticsIntegrationsPage({ searchParams }: Props) {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)
  if (appUser.role !== "admin") redirect(paths.dashboard)

  const { page: pageParam } = await searchParams
  const page = Math.max(0, Number(pageParam ?? 0) || 0)

  return (
    <>
      <Header
        page="Analytics"
        description="Integration invocation history"
      />
      <div className="flex flex-col gap-6 p-6">
        <IntegrationsView orgId={appUser.orgId} page={page} />
      </div>
    </>
  )
}
