import { NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const PAGE_SIZE = 20

// 30-day window is hardcoded for MVP (same as metrics).
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000

export async function GET(req: Request) {
  const { appUser } = await getServerAuth()
  if (!appUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (appUser.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type') // 'agent' | 'workflow' | null (all)
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10))

  const supabase = await createClient()
  const since = new Date(Date.now() - WINDOW_MS).toISOString()

  let query = supabase
    .from('usage_logs')
    .select(
      'id, resource_key, resource_type, tokens_in, tokens_out, cost_estimate, duration_ms, status, created_at, user_id'
    )
    .eq('org_id', appUser.orgId)
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (type === 'agent' || type === 'workflow') query = query.eq('resource_type', type)

  const { data: rows, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const agentKeys = [
    ...new Set(
      (rows ?? [])
        .filter((r) => r.resource_type === 'agent' && r.resource_key)
        .map((r) => r.resource_key as string)
    ),
  ]
  const workflowKeys = [
    ...new Set(
      (rows ?? [])
        .filter((r) => r.resource_type === 'workflow' && r.resource_key)
        .map((r) => r.resource_key as string)
    ),
  ]

  const [{ data: agents }, { data: workflows }] = await Promise.all([
    supabase
      .from('org_agents')
      .select('agent_key, display_name')
      .eq('org_id', appUser.orgId)
      .in('agent_key', agentKeys.length ? agentKeys : ['']),
    supabase
      .from('org_workflows')
      .select('workflow_key, display_name')
      .eq('org_id', appUser.orgId)
      .in('workflow_key', workflowKeys.length ? workflowKeys : ['']),
  ])

  const nameMap = {
    ...Object.fromEntries((agents ?? []).map((r) => [r.agent_key, r.display_name])),
    ...Object.fromEntries((workflows ?? []).map((r) => [r.workflow_key, r.display_name])),
  }

  return NextResponse.json(
    (rows ?? []).map((r) => ({
      ...r,
      displayName: r.resource_key ? (nameMap[r.resource_key] ?? r.resource_key) : 'Unknown',
    }))
  )
}
