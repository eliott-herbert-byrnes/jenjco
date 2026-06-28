import { Suspense } from "react"
import { redirect } from "next/navigation"
import { paths } from "@/app/paths"
import { ProcessListPanelSkeleton } from "@/features/processes/components/process-list-panel-skeleton"
import { ProcessListSection } from "@/features/processes/components/process-list-section"
import { getServerAuth } from "@/lib/auth"
import { Header } from "@/components/header"

export default async function ProcessesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)

  return (
    <>
      <Header
        page="Processes"
        description="Review and manage your organisation processes"
      />
      <div className="flex h-[calc(100dvh-3.5rem)] flex-col overflow-hidden md:flex-row">
        <aside className="max-h-[40vh] w-full shrink-0 overflow-y-auto border-b md:max-h-none md:w-72 md:border-b-0 md:border-r">
          <Suspense fallback={<ProcessListPanelSkeleton />}>
            <ProcessListSection orgId={appUser.orgId} role={appUser.role} />
          </Suspense>
        </aside>
        <main className="flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </main>
      </div>
    </>
  )
}
