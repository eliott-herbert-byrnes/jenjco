import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { AuditNav } from "@/features/audit/components/audit-nav"
import { IntegrationsInvocationsView } from "@/features/audit/components/integrations-invocations-view"
import { InvocationsView } from "@/features/audit/components/invocations-view"
import { LogsView } from "@/features/audit/components/logs-view"
import { getServerAuth } from "@/lib/auth"
import { Header } from "@/components/header"

export const metadata: Metadata = { title: "Audit" }

type Tab = "workflows" | "integrations" | "logs"

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)
  if (appUser.role !== "admin") redirect(paths.dashboard)

  const params = await searchParams
  const { tab = "workflows", page: pageParam } = params
  const page = Math.max(0, parseInt(pageParam ?? "0", 10))

  const activeTab: Tab =
    tab === "integrations"
      ? "integrations"
      : tab === "logs"
        ? "logs"
        : "workflows"

  if (activeTab === "workflows" && params.view === "metrics") {
    redirect(`${paths.audit}?tab=workflows`)
  }

  return (
    <>
      <Header page="Audit" description="Usage and invocation history" />
      <div className="flex flex-col gap-6 p-6">
        <AuditNav activeTab={activeTab} />

        {activeTab === "integrations" ? (
          <IntegrationsInvocationsView orgId={appUser.orgId} page={page} />
        ) : activeTab === "logs" ? (
          <LogsView orgId={appUser.orgId} page={page} />
        ) : (
          <InvocationsView orgId={appUser.orgId} page={page} />
        )}
      </div>
    </>
  )
}
