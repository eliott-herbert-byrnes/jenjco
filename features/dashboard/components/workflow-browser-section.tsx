import { WorkflowBrowser } from "@/features/dashboard/components/workflow-browser"
import type { WorkflowHubRow } from "@/features/workflows/types"
import { createClient } from "@/lib/supabase/server"

type WorkflowBrowserSectionProps = {
  orgId: string
}

export async function WorkflowBrowserSection({ orgId }: WorkflowBrowserSectionProps) {
  const supabase = await createClient()

  const [
    { data: departments, error: departmentsError },
    { data: workflows, error: workflowsError },
  ] = await Promise.all([
    supabase
      .from("departments")
      .select("id, name, color")
      .eq("org_id", orgId)
      .order("sort_order", { ascending: true }),
    supabase.rpc("get_workflows_hub", { p_org_id: orgId }),
  ])

  if (departmentsError) throw new Error(departmentsError.message)
  if (workflowsError) throw new Error(workflowsError.message)

  return (
    <WorkflowBrowser
      departments={departments ?? []}
      workflows={(workflows ?? []) as WorkflowHubRow[]}
    />
  )
}
