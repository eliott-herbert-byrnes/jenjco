import { ProcessListPanel } from "@/features/processes/components/process-list-panel"
import type { AppRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

type ProcessListSectionProps = {
  orgId: string
  role: AppRole
}

export async function ProcessListSection({
  orgId,
  role,
}: ProcessListSectionProps) {
  const supabase = await createClient()

  const [
    { data: depts, error: deptsError },
    { data: processes, error: processesError },
  ] = await Promise.all([
    supabase
      .from("departments")
      .select("id, name, sort_order")
      .eq("org_id", orgId)
      .order("sort_order"),
    supabase
      .from("org_processes")
      .select("id, title, department_id, slug")
      .eq("org_id", orgId)
      .order("title"),
  ])

  if (deptsError) throw new Error(deptsError.message)
  if (processesError) throw new Error(processesError.message)

  const grouped = (depts ?? []).map((d) => ({
    ...d,
    processes: (processes ?? []).filter((p) => p.department_id === d.id),
  }))

  return <ProcessListPanel departments={grouped} role={role} />
}
