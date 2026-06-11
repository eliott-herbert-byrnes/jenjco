import { redirect } from "next/navigation"

import { paths } from "@/app/paths"
import { FeaturedActionsClient } from "@/features/dashboard/components/featured-actions-client"
import { getServerAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function FeaturedActions() {
  const { appUser } = await getServerAuth()
  if (!appUser) redirect(paths.signIn)

  const supabase = await createClient()
  const { data: teams } = await supabase
    .from("departments")
    .select("id, name")
    .eq("org_id", appUser.orgId)
    .order("sort_order", { ascending: true })

  return <FeaturedActionsClient teams={teams ?? []} />
}
