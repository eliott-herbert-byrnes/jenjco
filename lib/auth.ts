import { createClient } from "@/lib/supabase/server"
import { fetchOrganizationByOrgId } from "@/lib/auth/fetch-organization"
import {
  mapUsersProfileRow,
  type UsersProfileRow,
} from "@/lib/auth/map-profile"
import type { ServerAuthContext } from "@/lib/auth/types"

const PROFILE_SELECT = `
  id,
  org_id,
  email,
  role,
  display_name,
  organizations (
    id,
    name,
    slug
  )
` as const

/**
 * Server-only: reads the Supabase session from cookies and loads the matching
 * `public.users` row plus organization. Use in Server Components, actions, and route handlers.
 */
export async function getServerAuth(): Promise<ServerAuthContext> {
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return { authUser: null, appUser: null, organization: null }
  }

  const { data: row, error } = await supabase
    .from("users")
    .select(PROFILE_SELECT)
    .eq("supabase_auth_id", authUser.id)
    .maybeSingle()

  if (error || !row) {
    return { authUser, appUser: null, organization: null }
  }

  const mapped = mapUsersProfileRow(row as unknown as UsersProfileRow)
  let organization = mapped.organization
  if (!organization && mapped.appUser) {
    organization = await fetchOrganizationByOrgId(
      supabase,
      mapped.appUser.orgId
    )
  }

  return { authUser, appUser: mapped.appUser, organization }
}

export type {
  AppUser,
  AppRole,
  OrganizationSummary,
  ServerAuthContext,
} from "@/lib/auth/types"
