import { notFound, redirect } from 'next/navigation'
import { z } from 'zod'
import { paths } from '@/app/paths'
import { ProcessDetail } from '@/features/processes/components/process-detail'
import { getServerAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

const uuidParam = z.string().uuid()

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
      'id, title, content, slug, department_id, created_at, updated_at, departments(name)'
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

  return (
    <ProcessDetail
      process={{
        id: row.id,
        title: row.title,
        content: row.content ?? '',
        departmentName,
        updatedAt: row.updated_at,
      }}
      role={appUser.role}
    />
  )
}
