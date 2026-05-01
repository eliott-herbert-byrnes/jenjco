import { randomUUID } from "crypto"
import { NextResponse } from "next/server"
import { z } from "zod"
import { getServerAuth } from "@/lib/auth"
import { generateEmbedding } from "@/lib/embeddings"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { withRetry } from "@/lib/with-retry"

const postBodySchema = z.object({
  title: z.string().min(1),
  content: z.string(),
  department_id: z.string().uuid(),
})

function slugForNewProcess(title: string): string {
  const base =
    title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "process"
  return `${base}-${randomUUID().slice(0, 8)}`
}

export async function GET(request: Request) {
  const { appUser } = await getServerAuth()
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const departmentIdRaw = searchParams.get("department_id")
  if (departmentIdRaw !== null && departmentIdRaw !== "") {
    const parsed = z.string().uuid().safeParse(departmentIdRaw)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid department_id" },
        { status: 400 }
      )
    }
  }

  const supabase = await createClient()
  let query = supabase
    .from("org_processes")
    .select("id, title, department_id, slug, updated_at")
    .eq("org_id", appUser.orgId)
    .order("title")

  if (departmentIdRaw) {
    query = query.eq("department_id", departmentIdRaw)
  }

  const { data, error } = await query
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}

export async function POST(request: Request) {
  const { appUser } = await getServerAuth()
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (appUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = postBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const { title, content, department_id } = parsed.data
  const admin = createAdminClient()

  const { data: dept, error: deptError } = await admin
    .from("departments")
    .select("id")
    .eq("id", department_id)
    .eq("org_id", appUser.orgId)
    .maybeSingle()

  if (deptError) {
    return NextResponse.json({ error: deptError.message }, { status: 500 })
  }
  if (!dept) {
    return NextResponse.json({ error: "Invalid department_id" }, { status: 400 })
  }

  const slug = slugForNewProcess(title)
  const now = new Date().toISOString()

  const { data: inserted, error: insertError } = await admin
    .from("org_processes")
    .insert({
      org_id: appUser.orgId,
      department_id,
      title,
      slug,
      content,
      updated_at: now,
    })
    .select("id, title, department_id, slug, content, created_at, updated_at")
    .single()

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  const rowId = inserted.id

  try {
    // Same composition as seed: title + body for retrieval quality.
    // MVP: text-embedding-3-small accepts up to ~8,191 tokens (~6,000 words); excess is
    // silently truncated by the API. Post-MVP: chunked embedding — see generateEmbedding JSDoc.
    const embedding = await withRetry(() =>
      generateEmbedding(`${title}\n\n${content}`)
    )
    const { error: embError } = await admin
      .from("org_processes")
      .update({ embedding })
      .eq("id", rowId)

    if (embError) throw embError
  } catch {
    await admin.from("org_processes").delete().eq("id", rowId)
    return NextResponse.json(
      { error: "Failed to generate embedding" },
      { status: 500 }
    )
  }

  return NextResponse.json(inserted, { status: 201 })
}
