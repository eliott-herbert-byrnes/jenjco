import { UsersView } from "@/features/organisation/users/components/users-view"
import type {
  DepartmentOption,
  OrgUserRow,
} from "@/features/organisation/users/types"
import { createClient } from "@/lib/supabase/server"

type UserRowWithDepartment = {
  id: string
  email: string
  role: "admin" | "viewer"
  display_name: string | null
  department_id: string | null
  is_active: boolean
  invited_at: string | null
  created_at: string
  departments: { name: string } | null
}

type UsersSectionProps = {
  orgId: string
  currentUserId: string
}

export async function UsersSection({
  orgId,
  currentUserId,
}: UsersSectionProps) {
  const supabase = await createClient()

  const [{ data: rows, error }, { data: departmentRows }] = await Promise.all([
    supabase
      .from("users")
      .select(
        "id, email, role, display_name, is_active, invited_at, created_at, department_id, departments(name)"
      )
      .eq("org_id", orgId)
      .order("created_at"),
    supabase
      .from("departments")
      .select("id, name")
      .eq("org_id", orgId)
      .order("sort_order"),
  ])

  if (error) {
    throw new Error(error.message)
  }

  const users: OrgUserRow[] = ((rows ?? []) as UserRowWithDepartment[]).map(
    (row) => ({
      id: row.id,
      email: row.email,
      role: row.role,
      display_name: row.display_name,
      department_id: row.department_id,
      department_name: row.departments?.name ?? null,
      is_active: row.is_active,
      invited_at: row.invited_at,
      created_at: row.created_at,
    })
  )

  const departments = (departmentRows ?? []) as DepartmentOption[]

  return (
    <UsersView
      users={users}
      departments={departments}
      currentUserId={currentUserId}
    />
  )
}
