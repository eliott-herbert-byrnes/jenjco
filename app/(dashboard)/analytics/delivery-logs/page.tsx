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
import { DeliveryLogsFilters } from "@/features/analytics/components/delivery-logs-filters"
import { DeliveryLogsResultsSection } from "@/features/analytics/components/delivery-logs-results-section"
import { DeliveryLogsSkeleton } from "@/features/analytics/components/delivery-logs-skeleton"
import { getServerAuth } from "@/lib/auth"

export const metadata: Metadata = { title: "Analytics Delivery Logs" }

type Props = {
  searchParams: Promise<{
    page?: string
    search?: string
    status?: string
    event?: string
  }>
}

export default async function AnalyticsDeliveryLogsPage({
  searchParams,
}: Props) {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)
  if (appUser.role !== "admin") redirect(paths.dashboard)

  const params = await searchParams
  const page = Math.max(0, Number(params.page ?? 0) || 0)
  const filterParams = {
    search: params.search,
    status: params.status,
    event: params.event,
  }

  return (
    <>
      <Header
        page="Analytics"
        description="Workflow notification delivery history"
      />
      <div className="flex flex-col gap-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>Delivery Logs</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <DeliveryLogsFilters {...filterParams} />
            <Suspense
              key={`${page}-${params.search ?? ""}-${params.status ?? ""}-${params.event ?? ""}`}
              fallback={<DeliveryLogsSkeleton />}
            >
              <DeliveryLogsResultsSection
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
