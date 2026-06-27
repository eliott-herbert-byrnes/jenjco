"use server"

import { revalidatePath } from "next/cache"

import { paths } from "@/app/paths"
import type { ActionResult } from "@/features/organisation/users/lib/action-helpers"
import { requireAdminActor } from "@/features/organisation/users/lib/action-helpers"
import { orgWorkflowIdSchema } from "@/features/workflows/notifications/lib/validation"
import { fetchOrgWorkflowForNotifications } from "@/features/workflows/notifications/lib/workflow-access"
import { createClient } from "@/lib/supabase/server"

export type DisableWorkflowNotificationResult = ActionResult

export async function disableWorkflowNotification(
  input: unknown
): Promise<DisableWorkflowNotificationResult> {
  const auth = await requireAdminActor()
  if (!auth.ok) {
    return auth.result
  }
  const { appUser } = auth

  const parsed = orgWorkflowIdSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: "Invalid workflow" }
  }

  const supabase = await createClient()
  const workflowResult = await fetchOrgWorkflowForNotifications(
    supabase,
    appUser.orgId,
    parsed.data.orgWorkflowId
  )
  if (!workflowResult.ok) {
    return { success: false, error: workflowResult.error }
  }

  const { error } = await supabase
    .from("workflow_notification_settings")
    .update({
      enabled: false,
      updated_by: appUser.id,
      updated_at: new Date().toISOString(),
    })
    .eq("org_workflow_id", parsed.data.orgWorkflowId)
    .eq("org_id", appUser.orgId)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(paths.workflows)
  return { success: true }
}
