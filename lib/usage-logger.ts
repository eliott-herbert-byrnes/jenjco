import { createClient } from '@/lib/supabase/server'

// Cost rates are approximations for GPT-4o as of 2026-Q2.
// Different models have different rates. Replace with per-model lookup in v1
// when multi-model billing support is added.
// Input: $0.15 / 1M tokens  Output: $0.60 / 1M tokens
const COST_PER_INPUT = 0.00015 / 1000
const COST_PER_OUTPUT = 0.0006 / 1000

export async function logUsage({
  orgId,
  userId,
  resourceKey,
  resourceType = 'agent',
  tokensIn,
  tokensOut,
  durationMs,
  status = 'success',
}: {
  orgId: string
  userId: string
  resourceKey: string
  resourceType?: 'agent' | 'workflow'
  tokensIn: number
  tokensOut: number
  durationMs?: number
  status?: 'success' | 'error'
}) {
  const supabase = await createClient()
  const costEstimate = tokensIn * COST_PER_INPUT + tokensOut * COST_PER_OUTPUT
  await supabase.from('usage_logs').insert({
    org_id: orgId,
    user_id: userId,
    resource_key: resourceKey,
    resource_type: resourceType,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    cost_estimate: costEstimate,
    duration_ms: durationMs ?? null,
    status,
  })
}
