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
import { sendWorkflowTestEmail } from "@/lib/email/send-workflow-test-notification"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"

export type SendTestNotificationResult = ActionResult

export async function sendTestNotification(
  input: unknown
): Promise<SendTestNotificationResult> {
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

  const { orgWorkflowId } = parsed.data
  const supabase = await createClient()
  const workflowResult = await fetchOrgWorkflowForNotifications(
    supabase,
    appUser.orgId,
    orgWorkflowId
  )
  if (!workflowResult.ok) {
    return { success: false, error: workflowResult.error }
  }

  if (parsed.data.departmentId) {
    const departmentResult = await validateNotificationDepartment(
      supabase,
      appUser.orgId,
      parsed.data.departmentId
    )
    if (!departmentResult.ok) {
      return { success: false, error: departmentResult.error }
    }
  }

  const { resendId, error: sendError } = await sendWorkflowTestEmail({
    to: appUser.email,
    workflowName: workflowResult.workflow.display_name,
  })

  const admin = createAdminClient()

  const { data: existingSettings } = await supabase
    .from("workflow_notification_settings")
    .select("org_workflow_id")
    .eq("org_workflow_id", orgWorkflowId)
    .eq("enabled", true)
    .maybeSingle()

  const { error: logError } = await admin
    .from("workflow_notification_deliveries")
    .insert({
      org_id: appUser.orgId,
      org_workflow_id: orgWorkflowId,
      workflow_run_id: null,
      settings_id: existingSettings?.org_workflow_id ?? null,
      recipient_email: appUser.email,
      event_type: "test",
      delivery_mode: "immediate",
      status: sendError ? "failed" : "sent",
      error_message: sendError,
      resend_id: resendId,
    })

  if (logError) {
    return { success: false, error: logError.message }
  }

  if (sendError) {
    return { success: false, error: sendError }
  }

  revalidatePath(paths.workflows)
  return { success: true }
}
