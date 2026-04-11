import type { AppUser, AppRole, OrganizationSummary } from "@/lib/auth/types"

type OrgRow = { id: string; name: string; slug: string }

/** Shape returned by Supabase `.select()` for app user + org embed */
export type UsersProfileRow = {
  id: string
  org_id: string
  email: string
  role: string
  display_name: string | null
  organizations: OrgRow | OrgRow[] | null
}

function isAppRole(r: string): r is AppRole {
  return r === "admin" || r === "viewer"
}

export function mapUsersProfileRow(row: UsersProfileRow): {
  appUser: AppUser
  organization: OrganizationSummary | null
} {
  const orgRaw = row.organizations
  const orgRow = Array.isArray(orgRaw) ? orgRaw[0] : orgRaw

  const role = isAppRole(row.role) ? row.role : "viewer"

  const appUser: AppUser = {
    id: row.id,
    orgId: row.org_id,
    email: row.email,
    role,
    displayName: row.display_name,
  }

  const organization: OrganizationSummary | null = orgRow
    ? { id: orgRow.id, name: orgRow.name, slug: orgRow.slug }
    : null

  return { appUser, organization }
}
