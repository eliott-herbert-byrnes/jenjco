import type { Metadata } from "next"
import { Suspense } from "react"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { Header } from "@/components/header"
import { FeaturedActions } from "@/features/dashboard/components/featured-actions"
import { FeaturedActionsSkeleton } from "@/features/dashboard/components/featured-actions-skeleton"
import { WelcomeSection } from "@/features/dashboard/components/welcome-section"
import { WorkflowBrowserSection } from "@/features/dashboard/components/workflow-browser-section"
import { WorkflowBrowserSkeleton } from "@/features/dashboard/components/workflow-browser-skeleton"
import { getServerAuth } from "@/lib/auth"

export const metadata: Metadata = { title: "Dashboard" }

export default async function DashboardHomePage() {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)

  return (
    <>
      <Header
        page="Dashboard"
        description="Your organisation workflows at a glance"
      />
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6">
        <WelcomeSection displayName={appUser.displayName} />
        <Suspense fallback={<FeaturedActionsSkeleton />}>
          <FeaturedActions orgId={appUser.orgId} />
        </Suspense>
        <Suspense fallback={<WorkflowBrowserSkeleton />}>
          <WorkflowBrowserSection orgId={appUser.orgId} />
        </Suspense>
      </main>
    </>
  )
}
