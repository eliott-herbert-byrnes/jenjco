import { createAdminClient } from "@/lib/supabase/admin"
import { sendWorkflowNotification } from "@/lib/email/send-workflow-notification"
import type { WorkflowRunSummary } from "@/src/workflows/notifications/build-run-summary"

const DIGEST_LOOKBACK_MS = 60 * 60 * 1000

type DigestGroup = {
  orgId: string
  orgWorkflowId: string
  recipientEmail: string
  queueIds: string[]
  summaries: WorkflowRunSummary[]
}

function parseRunSummary(value: unknown): WorkflowRunSummary | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null
  }

  const record = value as Record<string, unknown>
  if (
    typeof record.workflowName !== "string" ||
    typeof record.timestamp !== "string" ||
    typeof record.trigger !== "string" ||
    !Array.isArray(record.steps)
  ) {
    return null
  }

  return value as WorkflowRunSummary
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization")
  if (
    !process.env.CRON_SECRET ||
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return Response.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = createAdminClient()
  const since = new Date(Date.now() - DIGEST_LOOKBACK_MS).toISOString()

  const { data: rows, error } = await supabase
    .from("workflow_notification_digest_queue")
    .select("id, org_id, org_workflow_id, recipient_email, run_summary, created_at")
    .gte("created_at", since)
    .order("created_at", { ascending: true })

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  if (!rows?.length) {
    return Response.json({ processed: 0, sent: 0, failed: 0 })
  }

  const groups = new Map<string, DigestGroup>()

  for (const row of rows) {
    const summary = parseRunSummary(row.run_summary)
    if (!summary) {
      continue
    }

    const key = `${row.recipient_email}:${row.org_workflow_id}`
    const existing = groups.get(key)

    if (existing) {
      existing.queueIds.push(row.id)
      existing.summaries.push(summary)
      continue
    }

    groups.set(key, {
      orgId: row.org_id,
      orgWorkflowId: row.org_workflow_id,
      recipientEmail: row.recipient_email,
      queueIds: [row.id],
      summaries: [summary],
    })
  }

  let sent = 0
  let failed = 0

  for (const group of groups.values()) {
    const workflowName = group.summaries[0]?.workflowName ?? "Workflow"
    const digestCount = group.summaries.length

    const { data: settings } = await supabase
      .from("workflow_notification_settings")
      .select("org_workflow_id")
      .eq("org_workflow_id", group.orgWorkflowId)
      .eq("enabled", true)
      .maybeSingle()

    const { resendId, error: sendError } = await sendWorkflowNotification({
      to: group.recipientEmail,
      workflowName,
      eventType: "digest",
      digestCount,
      digestSummaries: group.summaries,
    })

    const { error: logError } = await supabase
      .from("workflow_notification_deliveries")
      .insert({
        org_id: group.orgId,
        org_workflow_id: group.orgWorkflowId,
        workflow_run_id: null,
        settings_id: settings?.org_workflow_id ?? null,
        recipient_email: group.recipientEmail,
        event_type: "digest",
        delivery_mode: "digest",
        status: sendError ? "failed" : "sent",
        error_message: sendError,
        resend_id: resendId,
      })

    if (logError) {
      console.error("digest delivery log failed:", logError.message)
    }

    if (sendError) {
      failed += 1
      continue
    }

    sent += 1

    const { error: deleteError } = await supabase
      .from("workflow_notification_digest_queue")
      .delete()
      .in("id", group.queueIds)

    if (deleteError) {
      console.error("digest queue cleanup failed:", deleteError.message)
    }
  }

  return Response.json({
    processed: groups.size,
    sent,
    failed,
  })
}
