import { getServerAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { paths } from '@/app/paths'
import { AgentListPanel } from '@/features/agents/components/agent-list-panel'


export default async function AgentsLayout({ children }: { children: React.ReactNode }) {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)

  const supabase = await createClient()
  const { data: agents } = await supabase
    .from('org_agents')
    .select('id, display_name, description, is_active')
    .eq('org_id', appUser.orgId)
    .order('display_name')

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <aside className="w-72 shrink-0 overflow-y-auto border-r">
        <AgentListPanel agents={agents ?? []} />
      </aside>
      <main className="flex flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  )
}