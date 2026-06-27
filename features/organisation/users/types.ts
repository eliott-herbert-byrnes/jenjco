export type OrgUserRow = {
  id: string
  email: string
  role: "admin" | "viewer"
  display_name: string | null
  department_id: string | null
  department_name?: string | null
  is_active: boolean
  invited_at: string | null
  created_at: string
}

export type DepartmentOption = {
  id: string
  name: string
}
