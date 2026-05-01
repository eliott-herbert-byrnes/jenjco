import { NextResponse } from "next/server"
import { z } from "zod"
import { getServerAuth } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"

const uuidParam = z.string().uuid()

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { appUser } = await getServerAuth()
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { id } = await context.params
  const idParsed = uuidParam.safeParse(id)
  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from("org_workflows")
    .select(
      "id, workflow_key, display_name, description, is_active, config_overrides, created_at"
    )
    .eq("id", idParsed.data)
    .eq("org_id", appUser.orgId)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(data)
}
