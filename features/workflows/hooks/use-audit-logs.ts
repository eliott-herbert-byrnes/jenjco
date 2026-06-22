'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { WorkflowRunRow, WorkflowStepRunRow } from '../types'

const PAGE_SIZE = 10

const RUN_SELECT = `
  id,
  workflow_key,
  status,
  trigger,
  error,
  started_by,
  created_at,
  completed_at,
  users!started_by(display_name),
  workflow_step_runs(*)
`

type AuditSnapshot = {
  workflowKey: string
  page: number
  runs: WorkflowRunRow[]
  totalCount: number
  fetchError: string | null
}

function parseStepError(error: unknown): WorkflowStepRunRow['error'] {
  if (!error || typeof error !== 'object') return null
  const record = error as Record<string, unknown>
  if (typeof record.reason !== 'string') return null
  return {
    reason: record.reason,
    description: typeof record.description === 'string' ? record.description : '',
  }
}

function parseStepRun(row: Record<string, unknown>): WorkflowStepRunRow {
  return {
    id: String(row.id),
    step_id: String(row.step_id),
    kind: String(row.kind),
    status: String(row.status),
    error: parseStepError(row.error),
    created_at: String(row.created_at),
  }
}

function parseUser(value: unknown): WorkflowRunRow['users'] {
  if (!value || typeof value !== 'object') return null
  const record = value as Record<string, unknown>
  return {
    display_name:
      typeof record.display_name === 'string' ? record.display_name : null,
  }
}

function parseRun(row: Record<string, unknown>): WorkflowRunRow {
  const stepRuns = Array.isArray(row.workflow_step_runs)
    ? row.workflow_step_runs
        .map((step) => parseStepRun(step as Record<string, unknown>))
        .sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        )
    : []

  return {
    id: String(row.id),
    workflow_key: String(row.workflow_key),
    status: String(row.status),
    trigger: String(row.trigger),
    error: typeof row.error === 'string' ? row.error : null,
    started_by: typeof row.started_by === 'string' ? row.started_by : null,
    created_at: String(row.created_at),
    completed_at: typeof row.completed_at === 'string' ? row.completed_at : null,
    users: parseUser(row.users),
    workflow_step_runs: stepRuns,
  }
}

async function loadAuditLogs(workflowKey: string, pageIndex: number) {
  const supabase = createClient()
  const { data, count, error } = await supabase
    .from('workflow_runs')
    .select(RUN_SELECT, { count: 'exact' })
    .eq('workflow_key', workflowKey)
    .order('created_at', { ascending: false })
    .range(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE - 1)

  if (error) {
    return {
      runs: [] as WorkflowRunRow[],
      totalCount: 0,
      fetchError: error.message,
    }
  }

  return {
    runs: (data ?? []).map((row) => parseRun(row as Record<string, unknown>)),
    totalCount: count ?? 0,
    fetchError: null,
  }
}

export function useAuditLogs({
  workflowKey,
  running,
}: {
  workflowKey: string
  running: boolean
}) {
  const [page, setPage] = useState(0)
  const [refreshNonce, setRefreshNonce] = useState(0)
  const [snapshot, setSnapshot] = useState<AuditSnapshot | null>(null)
  const [prevRunning, setPrevRunning] = useState(running)

  if (prevRunning && !running) {
    if (page !== 0) {
      setPage(0)
    } else {
      setRefreshNonce((nonce) => nonce + 1)
    }
  }

  if (running !== prevRunning) {
    setPrevRunning(running)
  }

  const loading =
    snapshot === null ||
    snapshot.workflowKey !== workflowKey ||
    snapshot.page !== page

  const runs = loading ? [] : snapshot.runs
  const totalCount = loading ? 0 : snapshot.totalCount
  const fetchError = loading ? null : snapshot.fetchError

  useEffect(() => {
    let cancelled = false
    const pageIndex = page
    const key = workflowKey

    void loadAuditLogs(key, pageIndex).then((result) => {
      if (cancelled) return
      setSnapshot({
        workflowKey: key,
        page: pageIndex,
        runs: result.runs,
        totalCount: result.totalCount,
        fetchError: result.fetchError,
      })
    })

    return () => {
      cancelled = true
    }
  }, [workflowKey, page, refreshNonce])

  const changePage = useCallback((nextPage: number) => {
    setPage(nextPage)
  }, [])

  return { runs, totalCount, loading, fetchError, page, changePage }
}

export { PAGE_SIZE as AUDIT_LOGS_PAGE_SIZE }
