export type OrgUserRow = {
  id: string
  email: string
  role: "admin" | "viewer"
  display_name: string | null
  is_active: boolean
  invited_at: string | null
  created_at: string
}
