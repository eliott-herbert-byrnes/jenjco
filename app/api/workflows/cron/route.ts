import { createAdminClient } from "@/lib/supabase/admin"
import { WORKFLOWS, type WorkflowKey } from "@/src/workflows/index"
import {
  scheduleFinalize,
  startWorkflowRun,
} from "@/src/workflows/runtime/triggers"

function isWorkflowKey(key: string): key is WorkflowKey {
  return key in WORKFLOWS
}

type CronStarted = {
  orgWorkflowId: string
  orgId: string
  workflowKey: string
  ledgerRunId: string
}

type CronSkipped = {
  orgWorkflowId: string
  orgId: string
  workflowKey: string
  reason: string
}

type CronError = {
  orgWorkflowId: string
  orgId: string
  workflowKey: string
  error: string
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
  const { data: rows, error } = await supabase
    .from("org_workflows")
    .select("id, org_id, workflow_key")
    .eq("status", "active")
    .not("schedule_cron", "is", null)

  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const started: CronStarted[] = []
  const skipped: CronSkipped[] = []
  const errors: CronError[] = []

  for (const row of rows ?? []) {
    if (!isWorkflowKey(row.workflow_key)) {
      skipped.push({
        orgWorkflowId: row.id,
        orgId: row.org_id,
        workflowKey: row.workflow_key,
        reason: "workflow_not_registered",
      })
      continue
    }

    const workflowKey = row.workflow_key
    const startedAt = Date.now()

    try {
      const result = await startWorkflowRun({
        orgId: row.org_id,
        workflowKey,
        trigger: "cron",
        startedByUserId: null,
        orgWorkflowId: row.id,
      })

      if ("skipped" in result) {
        skipped.push({
          orgWorkflowId: row.id,
          orgId: row.org_id,
          workflowKey,
          reason: result.reason,
        })
        continue
      }

      scheduleFinalize({
        run: result.run,
        ledgerRunId: result.ledgerRunId,
        orgId: row.org_id,
        workflowKey,
        startedByUserId: null,
        departmentId: result.departmentId,
        startedAt,
      })

      started.push({
        orgWorkflowId: row.id,
        orgId: row.org_id,
        workflowKey,
        ledgerRunId: result.ledgerRunId,
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      errors.push({
        orgWorkflowId: row.id,
        orgId: row.org_id,
        workflowKey,
        error: message,
      })
    }
  }

  return Response.json({ started, skipped, errors })
}
