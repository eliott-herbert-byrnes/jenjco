import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { Header } from "@/components/header"
import { OverviewMetricsSection } from "@/features/analytics/components/overview-metrics-section"
import { OverviewMetricsSkeleton } from "@/features/analytics/components/overview-metrics-skeleton"
import { WorkflowSummaryTableSection } from "@/features/analytics/components/workflow-summary-table-section"
import { WorkflowSummaryTableSkeleton } from "@/features/analytics/components/workflow-summary-table-skeleton"
import { getServerAuth } from "@/lib/auth"

export const metadata: Metadata = { title: "Analytics Overview" }

export default async function AnalyticsOverviewPage() {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)
  if (appUser.role !== "admin") redirect(paths.dashboard)

  return (
    <>
      <Header
        page="Analytics"
        description="Workflow execution metrics and summaries"
      />
      <div className="flex flex-col gap-6 p-6">
        <Suspense fallback={<OverviewMetricsSkeleton />}>
          <OverviewMetricsSection orgId={appUser.orgId} />
        </Suspense>
        <Suspense fallback={<WorkflowSummaryTableSkeleton />}>
          <WorkflowSummaryTableSection orgId={appUser.orgId} />
        </Suspense>
      </div>
    </>
  )
}
