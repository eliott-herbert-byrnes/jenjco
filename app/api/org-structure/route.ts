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
    .from("departments")
    .select("id, name, parent_id, sort_order, org_processes(id)")
    .eq("org_id", appUser.orgId)
    .order("sort_order")

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const departments = (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    parent_id: r.parent_id,
    sort_order: r.sort_order,
    process_count: Array.isArray(r.org_processes) ? r.org_processes.length : 0,
  }))

  return NextResponse.json({ departments })
}
