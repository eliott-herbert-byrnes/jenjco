import { redirect } from 'next/navigation'

import { paths } from '@/app/paths'
import { AgentChat } from '@/features/agents/components/agent-chat'
import { getServerAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function AgentChatPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)

  if (appUser.role !== 'admin') {
    const supabase = await createClient()
    const { data: orgAgent } = await supabase
      .from('org_agents')
      .select('agent_key')
      .eq('id', id)
      .eq('org_id', appUser.orgId)
      .maybeSingle()

    if (orgAgent?.agent_key === 'drive-assistant') {
      redirect(paths.agents)
    }
  }

  return <AgentChat orgAgentId={id} />
}
