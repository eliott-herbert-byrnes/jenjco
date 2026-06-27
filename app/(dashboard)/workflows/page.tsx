import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { paths } from '@/app/paths'
import { Header } from '@/components/header'
import type { WorkflowHubRow } from '@/features/workflows/types'
import { getServerAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { WorkflowHub } from '@/features/workflows/components/workflow-hub'

export const metadata: Metadata = {
  title: 'Workflows',
}

export default async function WorkflowsHubPage() {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)

  const supabase = await createClient()

  const [{ data: workflows }, { data: departments }] = await Promise.all([
    supabase.rpc('get_workflows_hub', { p_org_id: appUser.orgId }),
    supabase
      .from('departments')
      .select('id, name, color')
      .eq('org_id', appUser.orgId)
      .order('sort_order'),
  ])

  return (
    <>
      <Header
        page="Workflows"
        description="Execute, manage, and troubleshoot workflows"
      />
      <WorkflowHub
        workflows={(workflows ?? []) as WorkflowHubRow[]}
        departments={departments ?? []}
        isAdmin={appUser.role === 'admin'}
      />
    </>
  )
}
