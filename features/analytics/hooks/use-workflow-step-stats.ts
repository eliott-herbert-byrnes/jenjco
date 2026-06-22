"use client"

import { useEffect, useState } from "react"

import type { WorkflowStepStatsRow } from "@/features/analytics/types"
import { createClient } from "@/lib/supabase/client"

type StepStatsSnapshot = {
  workflowKey: string
  steps: WorkflowStepStatsRow[]
  fetchError: string | null
}

function parseStepError(
  error: unknown
): WorkflowStepStatsRow["latest_error"] {
  if (!error || typeof error !== "object") return null
  const record = error as Record<string, unknown>
  if (typeof record.reason !== "string") return null
  return {
    reason: record.reason,
    description:
      typeof record.description === "string" ? record.description : "",
  }
}

function aggregateStepStats(
  runs: Array<{
    workflow_step_runs: Array<{
      step_id: string
      kind: string
      status: string
      error: unknown
      created_at: string
    }> | null
  }>
): WorkflowStepStatsRow[] {
  const byStep = new Map<string, WorkflowStepStatsRow>()

  for (const run of runs) {
    for (const step of run.workflow_step_runs ?? []) {
      const existing = byStep.get(step.step_id)
      const failed = step.status === "failed"

      if (!existing) {
        byStep.set(step.step_id, {
          step_id: step.step_id,
          kind: step.kind,
          total_executions: 1,
          failed_executions: failed ? 1 : 0,
          latest_status: step.status,
          latest_error: failed ? parseStepError(step.error) : null,
          last_executed_at: step.created_at,
        })
        continue
      }

      existing.total_executions += 1
      if (failed) existing.failed_executions += 1

      if (
        new Date(step.created_at).getTime() >
        new Date(existing.last_executed_at).getTime()
      ) {
        existing.latest_status = step.status
        existing.latest_error = failed ? parseStepError(step.error) : null
        existing.last_executed_at = step.created_at
      }
    }
  }

  return [...byStep.values()].sort((a, b) =>
    a.step_id.localeCompare(b.step_id)
  )
}

async function loadWorkflowStepStats(workflowKey: string) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("workflow_runs")
    .select("workflow_step_runs(step_id, kind, status, error, created_at)")
    .eq("workflow_key", workflowKey)
    .order("created_at", { ascending: false })
    .limit(100)

  if (error) {
    return {
      steps: [] as WorkflowStepStatsRow[],
      fetchError: error.message,
    }
  }

  return {
    steps: aggregateStepStats(data ?? []),
    fetchError: null,
  }
}

export function useWorkflowStepStats(workflowKey: string, enabled: boolean) {
  const [snapshot, setSnapshot] = useState<StepStatsSnapshot | null>(null)

  const loading =
    enabled &&
    (snapshot === null || snapshot.workflowKey !== workflowKey)

  const steps = loading || !enabled ? [] : snapshot?.steps ?? []
  const fetchError =
    loading || !enabled ? null : snapshot?.fetchError ?? null

  useEffect(() => {
    if (!enabled) return

    let cancelled = false
    const key = workflowKey

    void loadWorkflowStepStats(key).then((result) => {
      if (cancelled) return
      setSnapshot({
        workflowKey: key,
        steps: result.steps,
        fetchError: result.fetchError,
      })
    })

    return () => {
      cancelled = true
    }
  }, [workflowKey, enabled])

  return { steps, loading, fetchError }
}
