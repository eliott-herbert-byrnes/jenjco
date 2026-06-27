"use server"

import { revalidatePath } from "next/cache"

import { paths } from "@/app/paths"
import type { ActionResult } from "@/features/organisation/users/lib/action-helpers"
import { requireAdminActor } from "@/features/organisation/users/lib/action-helpers"
import {
  fetchOrgWorkflowForNotifications,
  validateNotificationDepartment,
} from "@/features/workflows/notifications/lib/workflow-access"
import { notificationConfigSchema } from "@/features/workflows/notifications/lib/validation"
import { createClient } from "@/lib/supabase/server"

export type UpsertWorkflowNotificationResult = ActionResult

export async function upsertWorkflowNotification(
  input: unknown
): Promise<UpsertWorkflowNotificationResult> {
  const auth = await requireAdminActor()
  if (!auth.ok) {
    return auth.result
  }
  const { appUser } = auth

  const parsed = notificationConfigSchema.safeParse(input)
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0]
    return {
      success: false,
      error: firstIssue?.message ?? "Invalid input",
    }
  }

  const {
    orgWorkflowId,
    notifyOnCompletion,
    notifyOnError,
    teamScope,
    departmentId,
    audience,
  } = parsed.data

  const supabase = await createClient()
  const workflowResult = await fetchOrgWorkflowForNotifications(
    supabase,
    appUser.orgId,
    orgWorkflowId
  )
  if (!workflowResult.ok) {
    return { success: false, error: workflowResult.error }
  }

  if (departmentId) {
    const departmentResult = await validateNotificationDepartment(
      supabase,
      appUser.orgId,
      departmentId
    )
    if (!departmentResult.ok) {
      return { success: false, error: departmentResult.error }
    }
  }

  const now = new Date().toISOString()
  const { error } = await supabase.from("workflow_notification_settings").upsert(
    {
      org_workflow_id: orgWorkflowId,
      org_id: appUser.orgId,
      enabled: true,
      notify_on_completion: notifyOnCompletion,
      notify_on_error: notifyOnError,
      team_scope: teamScope,
      department_id: teamScope === "department" ? departmentId : null,
      audience,
      updated_by: appUser.id,
      updated_at: now,
    },
    { onConflict: "org_workflow_id" }
  )

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath(paths.workflows)
  return { success: true }
}
