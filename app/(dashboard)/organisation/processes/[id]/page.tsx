import { notFound, redirect } from 'next/navigation'
import { z } from 'zod'
import { paths } from '@/app/paths'
import { ProcessDetail } from '@/features/processes/components/process-detail'
import {
  buildProcessDocument,
  type LinkedWorkflow,
} from '@/features/processes/lib/build-process-document'
import { getServerAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const uuidParam = z.string().uuid()

type ProcessWorkflowRow = {
  sort_order: number
  org_workflows:
    | { id: string; display_name: string }
    | { id: string; display_name: string }[]
    | null
}

function mapLinkedWorkflows(
  rows: ProcessWorkflowRow[] | null | undefined
): LinkedWorkflow[] {
  if (!rows) return []

  return rows.flatMap((row) => {
    const workflow = Array.isArray(row.org_workflows)
      ? row.org_workflows[0]
      : row.org_workflows
    if (!workflow) return []

    return [
      {
        id: workflow.id,
        display_name: workflow.display_name,
        sort_order: row.sort_order,
      },
    ]
  })
}

export default async function ProcessDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const idParsed = uuidParam.safeParse(id)
  if (!idParsed.success) {
    notFound()
  }

  const { appUser } = await getServerAuth()
  if (!appUser) {
    redirect(paths.signIn)
  }

  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from('org_processes')
    .select(
      'id, title, content, slug, department_id, created_at, updated_at, departments(name), process_workflows(sort_order, org_workflows(id, display_name))'
    )
    .eq('id', idParsed.data)
    .eq('org_id', appUser.orgId)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }
  if (!row) {
    notFound()
  }

  const dept = row.departments as { name: string } | { name: string }[] | null
  const departmentName = Array.isArray(dept)
    ? dept[0]?.name ?? null
    : dept?.name ?? null

  const workflows = mapLinkedWorkflows(
    row.process_workflows as ProcessWorkflowRow[] | null
  )
  const composedContent = buildProcessDocument({
    workflows,
    content: row.content ?? '',
  })

  return (
    <ProcessDetail
      process={{
        id: row.id,
        title: row.title,
        content: row.content ?? '',
        departmentName,
        updatedAt: row.updated_at,
      }}
      composedContent={composedContent}
      role={appUser.role}
    />
  )
}
