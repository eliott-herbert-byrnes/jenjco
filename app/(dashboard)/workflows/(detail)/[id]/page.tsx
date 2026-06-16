import { getServerAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import { paths } from '@/app/paths'
import { Header } from '@/components/header'
import { WorkflowCanvas } from '@/features/workflows/components/workflow-canvas'

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)

  const supabase = await createClient()
  const { data: workflow } = await supabase
    .from('org_workflows')
    .select('id, workflow_key, display_name, description, status, config_overrides, created_at, schedule_cron, has_output')
    .eq('id', id)
    .eq('org_id', appUser.orgId)
    .single()

  if (!workflow) notFound()

  return (
    <>
      <Header page="Workflows" description={workflow.display_name} />
      <WorkflowCanvas workflow={workflow} role={appUser.role} />
    </>
  )
}
