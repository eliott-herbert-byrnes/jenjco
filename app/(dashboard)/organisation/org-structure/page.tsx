import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { paths } from "@/app/paths"
import { OrgStructureCanvas } from "@/features/org-structure/components/org-structure-canvas"
import type { DeptRow } from "@/features/org-structure/lib/layout"
import { getServerAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export const metadata: Metadata = { title: "Org Structure" }

export default async function OrgStructurePage() {
  const { appUser, organization } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)

  const supabase = await createClient()
  const { data } = await supabase
    .from("departments")
    .select("id, name, parent_id, sort_order, org_processes(id)")
    .eq("org_id", appUser.orgId)
    .order("sort_order")

  const departments: DeptRow[] = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    parent_id: r.parent_id,
    sort_order: r.sort_order,
    process_count: Array.isArray(r.org_processes) ? r.org_processes.length : 0,
  }))

  return (
    <div className="h-[calc(100vh-4rem)] w-full">
      <OrgStructureCanvas
        orgName={organization?.name ?? "Organisation"}
        departments={departments}
      />
    </div>
  )
}
