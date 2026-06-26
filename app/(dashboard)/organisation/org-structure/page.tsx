import type { Metadata } from "next"
import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { Header } from "@/components/header"
import { OrgStructureCanvas } from "@/features/org-structure/components/org-structure-canvas"
import type { DeptRow } from "@/features/org-structure/lib/layout"
import { getServerAuth } from "@/lib/auth"
import { isBrandColorKey } from "@/lib/brand-colors"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Org Structure" }

export default async function OrgStructurePage() {
  const { appUser, organization } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)

  const supabase = await createClient()
  const { data } = await supabase
    .from("departments")
    .select(
      "id, name, parent_id, sort_order, color, org_processes(id, title), org_workflows(id, display_name)"
    )
    .eq("org_id", appUser.orgId)
    .order("sort_order")

  const departments: DeptRow[] = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    parent_id: r.parent_id,
    sort_order: r.sort_order,
    color: isBrandColorKey(r.color) ? r.color : null,
    process_count: Array.isArray(r.org_processes) ? r.org_processes.length : 0,
    workflow_count: Array.isArray(r.org_workflows) ? r.org_workflows.length : 0,
    process_ids: Array.isArray(r.org_processes)
      ? r.org_processes.map((p: { id: string }) => p.id)
      : [],
    workflow_ids: Array.isArray(r.org_workflows)
      ? r.org_workflows.map((w: { id: string }) => w.id)
      : [],
    process_names: Array.isArray(r.org_processes)
      ? r.org_processes.map((p: { title: string }) => p.title)
      : [],
    workflow_names: Array.isArray(r.org_workflows)
      ? r.org_workflows.map((w: { display_name: string }) => w.display_name)
      : [],
  }))

  return (
    <>
      <div className="h-[calc(100vh-5rem)] w-full">
        <Header
          page="Organisation"
          description="Get a high level overview of your organisation"
        />
        <OrgStructureCanvas
          orgName={organization?.name ?? "Organisation"}
          departments={departments}
          logoUrl="/demo-client-logo/john-pye-logo.png"
        />
      </div>
    </>
  )
}
