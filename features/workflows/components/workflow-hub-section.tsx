import { WorkflowHub } from "@/features/workflows/components/workflow-hub"
import type { WorkflowHubRow } from "@/features/workflows/types"
import { createClient } from "@/lib/supabase/server"

type WorkflowHubSectionProps = {
  orgId: string
  isAdmin: boolean
}

export async function WorkflowHubSection({
  orgId,
  isAdmin,
}: WorkflowHubSectionProps) {
  const supabase = await createClient()

  const [
    { data: workflows, error: workflowsError },
    { data: departments, error: departmentsError },
  ] = await Promise.all([
    supabase.rpc("get_workflows_hub", { p_org_id: orgId }),
    supabase
      .from("departments")
      .select("id, name, color")
      .eq("org_id", orgId)
      .order("sort_order"),
  ])

  if (workflowsError) throw new Error(workflowsError.message)
  if (departmentsError) throw new Error(departmentsError.message)

  return (
    <WorkflowHub
      workflows={(workflows ?? []) as WorkflowHubRow[]}
      departments={departments ?? []}
      isAdmin={isAdmin}
    />
  )
}
