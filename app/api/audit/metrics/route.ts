/**
 * NOTE: This route is not currently consumed by the UI (which uses
 * Server Components with direct Supabase queries instead).
 * Retained for potential external use or future client-side migration.
 * TODO: evaluate for removal or adoption in a future PR.
 */
import { NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

// 30-day window is hardcoded for MVP.
// v1: accept ?from=&to= query params and add a date-range picker to the audit page.
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000

export async function GET(_req: Request) {
  const { appUser } = await getServerAuth()
  if (!appUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (appUser.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const supabase = await createClient()
  const since = new Date(Date.now() - WINDOW_MS).toISOString()

  // 1. Total conversation threads for the org (all time)
  const { count: totalConversations } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('org_id', appUser.orgId)

  // 2. Roll-up rows only — exclude workflow_step detail to avoid double-counting.
  const { data: rows } = await supabase
    .from('usage_logs')
    .select('resource_key, resource_type, tokens_in, tokens_out, cost_estimate, created_at')
    .eq('org_id', appUser.orgId)
    .in('resource_type', ['agent', 'workflow'])
    .eq('status', 'success') // exclude error rows from cost/token totals
    .gte('created_at', since)
    .order('created_at', { ascending: true })

  const allRows = rows ?? []

  // 3. Aggregate totals
  const totalTokensIn = allRows.reduce((s, r) => s + (r.tokens_in ?? 0), 0)
  const totalTokensOut = allRows.reduce((s, r) => s + (r.tokens_out ?? 0), 0)
  const totalCost = allRows.reduce((s, r) => s + Number(r.cost_estimate ?? 0), 0)

  // 4. Per-resource breakdown (join display names separately — simpler than relying on
  //    Supabase's implicit join syntax for a GROUP BY equivalent)
  const agentKeys = [
    ...new Set(
      allRows
        .filter((r) => r.resource_type === 'agent' && r.resource_key)
        .map((r) => r.resource_key as string)
    ),
  ]
  const workflowKeys = [
    ...new Set(
      allRows
        .filter((r) => r.resource_type === 'workflow' && r.resource_key)
        .map((r) => r.resource_key as string)
    ),
  ]

  const [{ data: agentNames }, { data: workflowNames }] = await Promise.all([
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

  const agentNameMap = Object.fromEntries((agentNames ?? []).map((r) => [r.agent_key, r.display_name]))
  const workflowNameMap = Object.fromEntries(
    (workflowNames ?? []).map((r) => [r.workflow_key, r.display_name])
  )

  const breakdown = Object.entries(
    allRows.reduce<
      Record<string, { resourceType: string; tokensIn: number; tokensOut: number; invocations: number }>
    >((acc, r) => {
      const key = r.resource_key ?? '__unknown__'
      if (!acc[key]) {
        acc[key] = { resourceType: r.resource_type, tokensIn: 0, tokensOut: 0, invocations: 0 }
      }
      acc[key].tokensIn += r.tokens_in ?? 0
      acc[key].tokensOut += r.tokens_out ?? 0
      acc[key].invocations++
      return acc
    }, {})
  ).map(([key, v]) => ({
    resourceKey: key,
    resourceType: v.resourceType,
    displayName:
      v.resourceType === 'agent' ? (agentNameMap[key] ?? key) : (workflowNameMap[key] ?? key),
    tokensIn: v.tokensIn,
    tokensOut: v.tokensOut,
    invocations: v.invocations,
  }))

  // 5. Daily totals for chart — bucket by YYYY-MM-DD in JS (fine for MVP row counts)
  const dailyMap: Record<string, number> = {}
  for (const r of allRows) {
    const created = r.created_at
    if (!created) continue
    const day = created.slice(0, 10)
    dailyMap[day] = (dailyMap[day] ?? 0) + (r.tokens_in ?? 0) + (r.tokens_out ?? 0)
  }
  const dailyUsage = Object.entries(dailyMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, tokens]) => ({ date, tokens }))

  return NextResponse.json({
    totalConversations: totalConversations ?? 0,
    totalTokensIn,
    totalTokensOut,
    totalCost,
    breakdown,
    dailyUsage,
  })
}
