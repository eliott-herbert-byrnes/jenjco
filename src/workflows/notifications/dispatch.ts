import type { Json } from "@/lib/database.types"
import { sendWorkflowNotification } from "@/lib/email/send-workflow-notification"
import { createAdminClient } from "@/lib/supabase/admin"
import {
  resolveNotificationRecipients,
  type ResolvedRecipient,
} from "@/features/workflows/notifications/resolve-recipients"
import type {
  NotificationAudience,
  NotificationTeamScope,
  WorkflowNotificationSettingsRow,
} from "@/features/workflows/notifications/types"

import {
  buildRunSummary,
  type WorkflowRunSummary,
} from "./build-run-summary"

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000

export type DispatchWorkflowNotificationsParams = {
  orgId: string
  orgWorkflowId: string
  ledgerRunId: string
  departmentId: string | null
  eventType: "completion" | "error"
}

async function loadNotificationSettings(
  orgWorkflowId: string
): Promise<WorkflowNotificationSettingsRow | null> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("workflow_notification_settings")
    .select("*")
    .eq("org_workflow_id", orgWorkflowId)
    .eq("enabled", true)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  return data
}

function isEventEnabled(
  settings: WorkflowNotificationSettingsRow,
  eventType: "completion" | "error"
): boolean {
  if (eventType === "completion") return settings.notify_on_completion
  return settings.notify_on_error
}

async function hasRecentImmediateCompletion(
  recipientEmail: string,
  orgWorkflowId: string
): Promise<boolean> {
  const supabase = createAdminClient()
  const since = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString()

  const { data, error } = await supabase
    .from("workflow_notification_deliveries")
    .select("id")
    .eq("recipient_email", recipientEmail)
    .eq("org_workflow_id", orgWorkflowId)
    .eq("event_type", "completion")
    .eq("delivery_mode", "immediate")
    .eq("status", "sent")
    .gte("created_at", since)
    .limit(1)
    .maybeSingle()

  if (error) {
    return false
  }

  return data != null
}

async function logDelivery(input: {
  orgId: string
  orgWorkflowId: string
  ledgerRunId: string | null
  settingsId: string | null
  recipientEmail: string
  eventType: "completion" | "error" | "digest"
  deliveryMode: "immediate" | "digest"
  status: "sent" | "failed" | "skipped"
  errorMessage?: string | null
  resendId?: string | null
}): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from("workflow_notification_deliveries").insert({
    org_id: input.orgId,
    org_workflow_id: input.orgWorkflowId,
    workflow_run_id: input.ledgerRunId,
    settings_id: input.settingsId,
    recipient_email: input.recipientEmail,
    event_type: input.eventType,
    delivery_mode: input.deliveryMode,
    status: input.status,
    error_message: input.errorMessage ?? null,
    resend_id: input.resendId ?? null,
  })

  if (error) {
    console.error("workflow_notification_deliveries insert failed:", error.message)
  }
}

async function queueForDigest(input: {
  orgId: string
  orgWorkflowId: string
  ledgerRunId: string
  recipientEmail: string
  runSummary: WorkflowRunSummary
}): Promise<void> {
  const supabase = createAdminClient()
  const { error } = await supabase.from("workflow_notification_digest_queue").insert({
    org_id: input.orgId,
    org_workflow_id: input.orgWorkflowId,
    workflow_run_id: input.ledgerRunId,
    recipient_email: input.recipientEmail,
    event_type: "completion",
    run_summary: input.runSummary as Json,
  })

  if (error) {
    console.error("workflow_notification_digest_queue insert failed:", error.message)
  }
}

async function deliverImmediate(input: {
  orgId: string
  orgWorkflowId: string
  ledgerRunId: string
  settingsId: string
  recipient: ResolvedRecipient
  eventType: "completion" | "error"
  runSummary: WorkflowRunSummary
}): Promise<void> {
  const { resendId, error: sendError } = await sendWorkflowNotification({
    to: input.recipient.email,
    workflowName: input.runSummary.workflowName,
    eventType: input.eventType,
    runSummary: input.runSummary,
  })

  await logDelivery({
    orgId: input.orgId,
    orgWorkflowId: input.orgWorkflowId,
    ledgerRunId: input.ledgerRunId,
    settingsId: input.settingsId,
    recipientEmail: input.recipient.email,
    eventType: input.eventType,
    deliveryMode: "immediate",
    status: sendError ? "failed" : "sent",
    errorMessage: sendError,
    resendId,
  })
}

async function logSkippedDelivery(input: {
  orgId: string
  orgWorkflowId: string
  ledgerRunId: string
  settingsId: string
}): Promise<void> {
  await logDelivery({
    orgId: input.orgId,
    orgWorkflowId: input.orgWorkflowId,
    ledgerRunId: input.ledgerRunId,
    settingsId: input.settingsId,
    recipientEmail: "none",
    eventType: "completion",
    deliveryMode: "immediate",
    status: "skipped",
    errorMessage: "No matching recipients",
  })
}

export async function dispatchWorkflowNotifications(
  params: DispatchWorkflowNotificationsParams
): Promise<void> {
  const settings = await loadNotificationSettings(params.orgWorkflowId)
  if (!settings || !isEventEnabled(settings, params.eventType)) {
    return
  }

  const supabase = createAdminClient()
  const recipients = await resolveNotificationRecipients(supabase, {
    orgId: params.orgId,
    audience: settings.audience as NotificationAudience,
    teamScope: settings.team_scope as NotificationTeamScope,
    settingsDepartmentId: settings.department_id,
    workflowDepartmentId: params.departmentId,
  })

  if (recipients.length === 0) {
    await logSkippedDelivery({
      orgId: params.orgId,
      orgWorkflowId: params.orgWorkflowId,
      ledgerRunId: params.ledgerRunId,
      settingsId: settings.org_workflow_id,
    })
    return
  }

  const runSummary = await buildRunSummary({
    orgWorkflowId: params.orgWorkflowId,
    ledgerRunId: params.ledgerRunId,
    eventType: params.eventType,
  })

  if (!runSummary) {
    return
  }

  for (const recipient of recipients) {
    if (params.eventType === "error") {
      await deliverImmediate({
        orgId: params.orgId,
        orgWorkflowId: params.orgWorkflowId,
        ledgerRunId: params.ledgerRunId,
        settingsId: settings.org_workflow_id,
        recipient,
        eventType: "error",
        runSummary,
      })
      continue
    }

    const recentlySent = await hasRecentImmediateCompletion(
      recipient.email,
      params.orgWorkflowId
    )

    if (!recentlySent) {
      await deliverImmediate({
        orgId: params.orgId,
        orgWorkflowId: params.orgWorkflowId,
        ledgerRunId: params.ledgerRunId,
        settingsId: settings.org_workflow_id,
        recipient,
        eventType: "completion",
        runSummary,
      })
    } else {
      await queueForDigest({
        orgId: params.orgId,
        orgWorkflowId: params.orgWorkflowId,
        ledgerRunId: params.ledgerRunId,
        recipientEmail: recipient.email,
        runSummary,
      })
    }
  }
}
