import { redirect } from 'next/navigation'
import { paths } from '@/app/paths'
import { ProcessListPanel } from '@/features/processes/components/process-list-panel'
import { getServerAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'

export default async function ProcessesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)

  const supabase = await createClient()
  const { data: depts } = await supabase
    .from('departments')
    .select('id, name, sort_order')
    .eq('org_id', appUser.orgId)
    .order('sort_order')

  const { data: processes } = await supabase
    .from('org_processes')
    .select('id, title, department_id, slug')
    .eq('org_id', appUser.orgId)
    .order('title')

  const grouped = (depts ?? []).map((d) => ({
    ...d,
    processes: (processes ?? []).filter((p) => p.department_id === d.id),
  }))

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden">
      <aside className="w-72 shrink-0 overflow-y-auto border-r">
        <ProcessListPanel departments={grouped} role={appUser.role} />
      </aside>
      <main className="flex flex-1 overflow-hidden">{children}</main>
    </div>
  )
}
