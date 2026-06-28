import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { Header } from "@/components/header"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SystemLogsFilters } from "@/features/analytics/components/system-logs-filters"
import { SystemLogsResultsSection } from "@/features/analytics/components/system-logs-results-section"
import { SystemLogsSkeleton } from "@/features/analytics/components/system-logs-skeleton"
import { getServerAuth } from "@/lib/auth"

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
  const filterParams = {
    search: params.search,
    status: params.status,
    type: params.type,
    team: params.team,
    from: params.from,
    to: params.to,
    tz: params.tz,
  }

  return (
    <>
      <Header page="Analytics" description="System usage and activity logs" />
      <div className="flex flex-col gap-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>System Logs</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <SystemLogsFilters {...filterParams} />
            <Suspense
              key={`${page}-${params.search ?? ""}-${params.status ?? ""}-${params.type ?? ""}-${params.team ?? ""}-${params.from ?? ""}-${params.to ?? ""}-${params.tz ?? ""}`}
              fallback={<SystemLogsSkeleton />}
            >
              <SystemLogsResultsSection
                orgId={appUser.orgId}
                page={page}
                {...filterParams}
              />
            </Suspense>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
