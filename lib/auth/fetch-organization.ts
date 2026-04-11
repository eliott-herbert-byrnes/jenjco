import type { SupabaseClient } from "@supabase/supabase-js"

import type { OrganizationSummary } from "@/lib/auth/types"

/**
 * Loads `public.organizations` by id. Use when the profile query embed does
 * not return the related row (RLS/embed quirks) but `users.org_id` is set.
 */
export async function fetchOrganizationByOrgId(
  supabase: SupabaseClient,
  orgId: string
): Promise<OrganizationSummary | null> {
  const { data, error } = await supabase
    .from("organizations")
    .select("id, name, slug")
    .eq("id", orgId)
    .maybeSingle()

  if (error || !data) return null
  return { id: data.id, name: data.name, slug: data.slug }
}
