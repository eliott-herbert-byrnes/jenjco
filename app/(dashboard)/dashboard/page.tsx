import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { Header } from "@/components/header"
import { FeaturedActions } from "@/features/dashboard/components/featured-actions"
import { WelcomeSection } from "@/features/dashboard/components/welcome-section"
import { WorkflowBrowser } from "@/features/dashboard/components/workflow-browser"
import type { WorkflowHubRow } from "@/features/workflows/types"
import { getServerAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardHomePage() {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)

  const supabase = await createClient()

  const [{ data: departments }, { data: workflows, error: workflowsError }] =
    await Promise.all([
      supabase
        .from("departments")
        .select("id, name, color")
        .eq("org_id", appUser.orgId)
        .order("sort_order", { ascending: true }),
      supabase.rpc("get_workflows_hub", { p_org_id: appUser.orgId }),
    ])

  if (workflowsError) throw new Error(workflowsError.message)

  return (
    <>
      <Header
        page="Dashboard"
        description="Your organisation workflows at a glance"
      />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
        <WelcomeSection displayName={appUser.displayName} />
        <FeaturedActions />
        <WorkflowBrowser
          departments={departments ?? []}
          workflows={(workflows ?? []) as WorkflowHubRow[]}
        />
      </main>
    </>
  )
}
