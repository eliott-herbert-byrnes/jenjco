import { createClient } from '@/lib/supabase/server'

export async function logUsage({
  orgId, userId, resourceKey, resourceType = 'agent', tokensIn, tokensOut,
}: {
  orgId: string
  userId: string
  resourceKey: string
  resourceType?: 'agent' | 'workflow'
  tokensIn: number
  tokensOut: number
}) {
  const supabase = await createClient()
  const costEstimate = (tokensIn * 0.00015 + tokensOut * 0.0006) / 1000
  await supabase.from('usage_logs').insert({
    org_id: orgId,
    user_id: userId,
    resource_key: resourceKey,
    resource_type: resourceType,
    tokens_in: tokensIn,
    tokens_out: tokensOut,
    cost_estimate: costEstimate,
  })
}