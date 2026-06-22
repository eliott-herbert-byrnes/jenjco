import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { Header } from "@/components/header"
import { SystemLogsView } from "@/features/analytics/components/system-logs-view"
import { getServerAuth } from "@/lib/auth"

export const metadata: Metadata = { title: "Analytics System Logs" }

type Props = {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
    type?: string
  }>
}

export default async function AnalyticsSystemLogsPage({ searchParams }: Props) {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)
  if (appUser.role !== "admin") redirect(paths.dashboard)

  const params = await searchParams
  const page = Math.max(0, Number(params.page ?? 0) || 0)

  return (
    <>
      <Header page="Analytics" description="System usage and activity logs" />
      <div className="flex flex-col gap-6 p-6">
        <SystemLogsView
          orgId={appUser.orgId}
          page={page}
          search={params.search}
          status={params.status}
          type={params.type}
        />
      </div>
    </>
  )
}
