'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WorkflowDailyRunRow, WorkflowDetailStats } from '../types'

function parseStats(row: Record<string, unknown>): WorkflowDetailStats {
  return {
    total_runs: Number(row.total_runs ?? 0),
    successful_runs: Number(row.successful_runs ?? 0),
    failed_runs: Number(row.failed_runs ?? 0),
    failure_rate: Number(row.failure_rate ?? 0),
    avg_duration_ms:
      row.avg_duration_ms != null ? Number(row.avg_duration_ms) : null,
    latest_run_status:
      typeof row.latest_run_status === 'string' ? row.latest_run_status : null,
    latest_run_created_at:
      typeof row.latest_run_created_at === 'string'
        ? row.latest_run_created_at
        : null,
    latest_run_completed_at:
      typeof row.latest_run_completed_at === 'string'
        ? row.latest_run_completed_at
        : null,
  }
}

function parseDailyRun(row: Record<string, unknown>): WorkflowDailyRunRow {
  return {
    run_date: String(row.run_date),
    successful_runs: Number(row.successful_runs ?? 0),
    failed_runs: Number(row.failed_runs ?? 0),
  }
}

async function loadWorkflowDetailStats(workflowKey: string) {
  const supabase = createClient()
  const [statsResult, dailyResult] = await Promise.all([
    supabase.rpc('get_workflow_detail_stats', {
      p_workflow_key: workflowKey,
    }),
    supabase.rpc('get_workflow_daily_runs', {
      p_workflow_key: workflowKey,
    }),
  ])

  if (statsResult.error || dailyResult.error) {
    return {
      stats: null,
      dailyRuns: [] as WorkflowDailyRunRow[],
      fetchError:
        statsResult.error?.message ??
        dailyResult.error?.message ??
        'Failed to load workflow stats',
    }
  }

  const statsRow = (statsResult.data?.[0] ?? null) as Record<
    string,
    unknown
  > | null

  return {
    stats: statsRow ? parseStats(statsRow) : null,
    dailyRuns: (dailyResult.data ?? []).map((row) =>
      parseDailyRun(row as Record<string, unknown>)
    ),
    fetchError: null,
  }
}

export function useWorkflowDetailStats({
  workflowKey,
  enabled,
}: {
  workflowKey: string | undefined
  enabled: boolean
}) {
  const [stats, setStats] = useState<WorkflowDetailStats | null>(null)
  const [dailyRuns, setDailyRuns] = useState<WorkflowDailyRunRow[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [prevWorkflowKey, setPrevWorkflowKey] = useState(workflowKey)

  if (workflowKey !== prevWorkflowKey) {
    setPrevWorkflowKey(workflowKey)
    setStats(null)
    setDailyRuns([])
    setLoading(false)
    setFetchError(null)
  }

  useEffect(() => {
    if (!enabled || !workflowKey) return

    const activeKey = workflowKey
    let cancelled = false

    async function load() {
      setLoading(true)
      setFetchError(null)

      const result = await loadWorkflowDetailStats(activeKey)

      if (cancelled) return

      setStats(result.stats)
      setDailyRuns(result.dailyRuns)
      setFetchError(result.fetchError)
      setLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [enabled, workflowKey])

  return { stats, dailyRuns, loading, fetchError }
}
