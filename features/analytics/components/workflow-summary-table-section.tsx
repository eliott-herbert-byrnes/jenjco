import { WorkflowSummaryTable } from "@/features/analytics/components/workflow-summary-table"
import type { WorkflowSummaryRow } from "@/features/analytics/types"
import { createClient } from "@/lib/supabase/server"

type WorkflowSummaryTableSectionProps = {
  orgId: string
}

export async function WorkflowSummaryTableSection({
  orgId,
}: WorkflowSummaryTableSectionProps) {
  const supabase = await createClient()

  const [
    { data: workflows, error: workflowsError },
    { data: departments },
  ] = await Promise.all([
    supabase.rpc("get_analytics_workflow_summary", { p_org_id: orgId }),
    supabase
      .from("departments")
      .select("id, name, color")
      .eq("org_id", orgId)
      .order("sort_order"),
  ])

  if (workflowsError) throw new Error(workflowsError.message)

  return (
    <WorkflowSummaryTable
      rows={(workflows ?? []) as WorkflowSummaryRow[]}
      departments={departments ?? []}
    />
  )
}
