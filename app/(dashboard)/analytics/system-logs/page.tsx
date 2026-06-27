import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { Header } from "@/components/header"
import { SystemLogsView } from "@/features/analytics/components/system-logs-view"
import { getServerAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Analytics System Logs" }

type Props = {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
    type?: string
    team?: string
    from?: string
    to?: string
    tz?: string
  }>
}

export default async function AnalyticsSystemLogsPage({ searchParams }: Props) {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)
  if (appUser.role !== "admin") redirect(paths.dashboard)

  const params = await searchParams
  const page = Math.max(0, Number(params.page ?? 0) || 0)

  const supabase = await createClient()
  const { data: departments } = await supabase
    .from("departments")
    .select("id, name, color")
    .eq("org_id", appUser.orgId)
    .order("sort_order")

  return (
    <>
      <Header page="Analytics" description="System usage and activity logs" />
      <div className="flex flex-col gap-6 p-6">
        <SystemLogsView
          orgId={appUser.orgId}
          departments={departments ?? []}
          page={page}
          search={params.search}
          status={params.status}
          type={params.type}
          team={params.team}
          from={params.from}
          to={params.to}
          tz={params.tz}
        />
      </div>
    </>
  )
}
