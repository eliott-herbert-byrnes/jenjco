import { notFound } from "next/navigation"

import { WorkflowCanvas } from "@/features/workflows/components/workflow-canvas"
import type { AppRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

type WorkflowDetailSectionProps = {
  id: string
  orgId: string
  role: AppRole
}

export async function WorkflowDetailSection({
  id,
  orgId,
  role,
}: WorkflowDetailSectionProps) {
  const supabase = await createClient()
  const { data: workflow } = await supabase
    .from("org_workflows")
    .select(
      "id, workflow_key, display_name, description, status, config_overrides, created_at, schedule_cron, has_output"
    )
    .eq("id", id)
    .eq("org_id", orgId)
    .single()

  if (!workflow) notFound()

  return <WorkflowCanvas workflow={workflow} role={role} />
}
