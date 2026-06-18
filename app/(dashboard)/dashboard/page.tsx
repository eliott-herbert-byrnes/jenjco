import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { Header } from "@/components/header"
import { FeaturedActions } from "@/features/dashboard/components/featured-actions"
import { WelcomeSection } from "@/features/dashboard/components/welcome-section"
import { WorkflowBrowser } from "@/features/dashboard/components/workflow-browser"
import { getServerAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardHomePage() {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)

  const supabase = await createClient()

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .eq("org_id", appUser.orgId)
    .order("sort_order", { ascending: true })

  return (
    <>
      <Header
        page="Dashboard"
        description="Your organisation workflows at a glance"
      />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-8">
        <WelcomeSection displayName={appUser.displayName} />
        <FeaturedActions />
        <WorkflowBrowser departments={departments ?? []} />
      </main>
    </>
  )
}
