import { NextResponse } from 'next/server'
import { getServerAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const { appUser } = await getServerAuth()
  if (!appUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('org_agents')
    .select(`
      id, agent_key, display_name, description, is_active,
      conversations!left(updated_at)
    `)
    .eq('org_id', appUser.orgId)
    .eq('conversations.user_id', appUser.id)
    .order('display_name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}