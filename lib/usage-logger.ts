import { createClient } from '@/lib/supabase/server'

export async function logUsage({
  orgId,
  userId,
  agentKey,
  tokensIn,
  tokensOut,
}: {
  orgId: string
  userId: string
  agentKey: string
  tokensIn: number
  tokensOut: number
}) {
  const supabase = await createClient()
  const costEstimate = (tokensIn * 0.00015 + tokensOut * 0.0006) / 1000

  await supabase.from('usage_logs').insert({
    org_id: orgId,
    user_id: userId,
    agent_key: agentKey,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    cost_estimate: costEstimate,
  })
}