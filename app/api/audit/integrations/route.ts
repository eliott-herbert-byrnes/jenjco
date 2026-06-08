import { NextResponse } from "next/server"

import { getServerAuth } from "@/lib/auth"
import { getProvider } from "@/lib/integrations/providers"
import { createClient } from "@/lib/supabase/server"

const PAGE_SIZE = 20

// 30-day window is hardcoded for MVP (same as metrics / invocations).
const WINDOW_MS = 30 * 24 * 60 * 60 * 1000

export async function GET(req: Request) {
  const { appUser } = await getServerAuth()
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (appUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { searchParams } = new URL(req.url)
  const page = Math.max(0, parseInt(searchParams.get("page") ?? "0", 10))

  const supabase = await createClient()
  const since = new Date(Date.now() - WINDOW_MS).toISOString()

  const { data: rows, error } = await supabase
    .from("integration_invocations")
    .select(
      "id, provider, endpoint, method, status, duration_ms, error_code, created_at, trigger_type, resource_key"
    )
    .eq("org_id", appUser.orgId)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(
    (rows ?? []).map((r) => ({
      ...r,
      providerLabel: getProvider(r.provider)?.label ?? r.provider,
    }))
  )
}
