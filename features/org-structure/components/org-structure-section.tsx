import { OrgStructureCanvas } from "@/features/org-structure/components/org-structure-canvas"
import type { DeptRow } from "@/features/org-structure/lib/layout"
import { isBrandColorKey } from "@/lib/brand-colors"
import { createClient } from "@/lib/supabase/server"

type OrgStructureSectionProps = {
  orgId: string
  orgName: string
}

export async function OrgStructureSection({
  orgId,
  orgName,
}: OrgStructureSectionProps) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("departments")
    .select(
      "id, name, parent_id, sort_order, color, org_processes(id, title), org_workflows(id, display_name)"
    )
    .eq("org_id", orgId)
    .order("sort_order")

  if (error) throw new Error(error.message)

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
    <OrgStructureCanvas
      orgName={orgName}
      departments={departments}
      logoUrl="/demo-client-logo/john-pye-logo.png"
    />
  )
}
