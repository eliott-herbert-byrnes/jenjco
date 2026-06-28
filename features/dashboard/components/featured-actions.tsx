import { FeaturedActionsClient } from "@/features/dashboard/components/featured-actions-client"
import { createClient } from "@/lib/supabase/server"

type FeaturedActionsProps = {
  orgId: string
}

export async function FeaturedActions({ orgId }: FeaturedActionsProps) {
  const supabase = await createClient()
  const { data: teams, error } = await supabase
    .from("departments")
    .select("id, name")
    .eq("org_id", orgId)
    .order("sort_order", { ascending: true })

  if (error) throw new Error(error.message)

  return <FeaturedActionsClient teams={teams ?? []} />
}
