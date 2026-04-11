import type { User as SupabaseAuthUser } from "@supabase/supabase-js"

export type AppRole = "admin" | "viewer"

/** Row in `public.users` (application profile). */
export type AppUser = {
  id: string
  orgId: string
  email: string
  role: AppRole
  displayName: string | null
}

export type OrganizationSummary = {
  id: string
  name: string
  slug: string
}

export type ServerAuthContext = {
  authUser: SupabaseAuthUser | null
  appUser: AppUser | null
  organization: OrganizationSummary | null
}
