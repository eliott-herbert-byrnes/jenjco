import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { Header } from "@/components/header"
import { DeliveryLogsView } from "@/features/analytics/components/delivery-logs-view"
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

  return (
    <>
      <Header
        page="Analytics"
        description="Workflow notification delivery history"
      />
      <div className="flex flex-col gap-6 p-6">
        <DeliveryLogsView
          orgId={appUser.orgId}
          page={page}
          search={params.search}
          status={params.status}
          event={params.event}
        />
      </div>
    </>
  )
}
