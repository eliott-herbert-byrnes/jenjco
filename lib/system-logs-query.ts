import type { SupabaseClient } from '@supabase/supabase-js'

import {
  localDateRangeToUtcBounds,
  type SystemLogsFilterParams,
} from '@/lib/date-range-filter'
import type { Database } from '@/lib/database.types'

export const SYSTEM_LOGS_PAGE_SIZE = 15
export const SYSTEM_LOGS_EXPORT_LIMIT = 10_000

export const SYSTEM_LOGS_SELECT =
  'id, resource_key, resource_type, run_id, step_id, tokens_in, tokens_out, duration_ms, status, created_at, department_id'

export type SystemLogRecord = {
  id: string
  resource_key: string | null
  resource_type: string
  run_id: string | null
  step_id: string | null
  tokens_in: number | null
  tokens_out: number | null
  duration_ms: number | null
  status: string
  created_at: string
  department_id: string | null
}

export function buildSystemLogsQuery(
  supabase: SupabaseClient<Database>,
  orgId: string,
  filters: SystemLogsFilterParams,
  options?: { count?: 'exact'; ids?: string[] },
) {
  let query = supabase
    .from('usage_logs')
    .select(SYSTEM_LOGS_SELECT, options?.count ? { count: 'exact' } : undefined)
    .eq('org_id', orgId)

  if (filters.search) {
    query = query.ilike('resource_key', `%${filters.search}%`)
  }
  if (filters.status) {
    query = query.eq('status', filters.status)
  }
  if (filters.type) {
    query = query.eq('resource_type', filters.type)
  }
  if (filters.team) {
    query = query.eq('department_id', filters.team)
  }

  if (filters.from && filters.to) {
    const bounds = localDateRangeToUtcBounds(
      filters.from,
      filters.to,
      filters.tz ?? 'UTC',
    )
    query = query.gte('created_at', bounds.start).lt('created_at', bounds.end)
  }

  if (options?.ids?.length) {
    query = query.in('id', options.ids)
  }

  return query.order('created_at', { ascending: false })
}

export function escapeCsvValue(value: unknown): string {
  if (value == null) return ''
  const str = String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function systemLogsToCsv(
  rows: SystemLogRecord[],
  departmentNames: Map<string, string>,
): string {
  const headers = [
    'Time',
    'Resource',
    'Type',
    'Team',
    'Run ID',
    'Step',
    'Tokens In',
    'Tokens Out',
    'Duration (ms)',
    'Status',
  ]

  const lines = rows.map((row) => {
    const teamName = row.department_id
      ? (departmentNames.get(row.department_id) ?? '')
      : ''

    return [
      row.created_at,
      row.resource_key,
      row.resource_type,
      teamName,
      row.run_id,
      row.step_id,
      row.tokens_in,
      row.tokens_out,
      row.duration_ms,
      row.status,
    ]
      .map(escapeCsvValue)
      .join(',')
  })

  return [headers.join(','), ...lines].join('\n')
}

export function systemLogsToExportRows(
  rows: SystemLogRecord[],
  departmentNames: Map<string, string>,
) {
  return rows.map((row) => ({
    id: row.id,
    time: row.created_at,
    resource: row.resource_key,
    type: row.resource_type,
    team: row.department_id
      ? (departmentNames.get(row.department_id) ?? null)
      : null,
    department_id: row.department_id,
    run_id: row.run_id,
    step_id: row.step_id,
    tokens_in: row.tokens_in,
    tokens_out: row.tokens_out,
    duration_ms: row.duration_ms,
    status: row.status,
  }))
}
