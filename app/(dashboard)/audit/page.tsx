import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { AuditNav } from "@/features/audit/components/audit-nav"
import { IntegrationsInvocationsView } from "@/features/audit/components/integrations-invocations-view"
import { InvocationsView } from "@/features/audit/components/invocations-view"
import { LogsView } from "@/features/audit/components/logs-view"
import { MetricsView } from "@/features/audit/components/metrics-view"
import { getServerAuth } from "@/lib/auth"

export const metadata: Metadata = { title: "Audit" }

type Tab = "agents" | "workflows" | "integrations"
type View = "metrics" | "invocations" | "logs"

export default async function AuditPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>
}) {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)
  if (appUser.role !== "admin") redirect(paths.dashboard)

  const params = await searchParams
  const { tab = "agents", view = "metrics" } = params
  const activeTab: Tab =
    tab === "workflows"
      ? "workflows"
      : tab === "integrations"
        ? "integrations"
        : "agents"
  const activeView: View = ["metrics", "invocations", "logs"].includes(
    view ?? ""
  )
    ? (view as View)
    : "metrics"

  return (
    <div className="flex flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Audit</h1>
        <p className="text-sm text-muted-foreground">
          Usage metrics and invocation history · last 30 days
        </p>
      </div>

      <AuditNav activeTab={activeTab} activeView={activeView} />

      {activeTab === "integrations" ? (
        <IntegrationsInvocationsView orgId={appUser.orgId} />
      ) : (
        <>
          {activeView === "metrics" && (
            <MetricsView tab={activeTab} orgId={appUser.orgId} />
          )}
          {activeView === "invocations" && (
            <InvocationsView tab={activeTab} orgId={appUser.orgId} />
          )}
          {activeView === "logs" && <LogsView orgId={appUser.orgId} />}
        </>
      )}
    </div>
  )
}
