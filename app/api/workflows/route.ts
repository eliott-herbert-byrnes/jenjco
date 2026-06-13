import { NextResponse } from "next/server"
import { getServerAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  const { appUser } = await getServerAuth()
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("org_workflows")
    .select(
      "id, workflow_key, display_name, description, status, config_overrides"
    )
    .eq("org_id", appUser.orgId)
    .order("display_name")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
