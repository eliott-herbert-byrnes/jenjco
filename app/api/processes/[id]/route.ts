import { NextResponse } from "next/server"
import { z } from "zod"
import { getServerAuth } from "@/lib/auth"
import { generateEmbedding } from "@/lib/embeddings"
import { createAdminClient } from "@/lib/supabase/admin"
import { createClient } from "@/lib/supabase/server"
import { withRetry } from "@/lib/with-retry"

const uuidParam = z.string().uuid()

const putBodySchema = z
  .object({
    title: z.string().min(1).optional(),
    content: z.string().optional(),
    department_id: z.string().uuid().optional(),
  })
  .refine(
    (b) =>
      b.title !== undefined ||
      b.content !== undefined ||
      b.department_id !== undefined,
    { message: "At least one of title, content, department_id is required" }
  )

type ProcessSnapshot = {
  title: string
  content: string | null
  department_id: string
  updated_at: string
}

export async function GET(
  _request: Request,
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
    .from("org_processes")
    .select(
      "id, title, content, slug, department_id, created_at, updated_at"
    )
    .eq("id", idParsed.data)
    .eq("org_id", appUser.orgId)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }
  return NextResponse.json(data)
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { appUser } = await getServerAuth()
  if (!appUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  if (appUser.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { id } = await context.params
  const idParsed = uuidParam.safeParse(id)
  if (!idParsed.success) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 })
  }

  let json: unknown
  try {
    json = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = putBodySchema.safeParse(json)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    )
  }

  const admin = createAdminClient()
  const processId = idParsed.data

  const { data: existing, error: fetchError } = await admin
    .from("org_processes")
    .select("id, title, content, department_id, updated_at")
    .eq("id", processId)
    .eq("org_id", appUser.orgId)
    .maybeSingle()

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 })
  }
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const snapshot: ProcessSnapshot = {
    title: existing.title,
    content: existing.content,
    department_id: existing.department_id,
    updated_at: existing.updated_at,
  }

  const title = parsed.data.title ?? existing.title
  const content = parsed.data.content ?? existing.content ?? ""
  const department_id =
    parsed.data.department_id ?? existing.department_id

  if (parsed.data.department_id !== undefined) {
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
      return NextResponse.json(
        { error: "Invalid department_id" },
        { status: 400 }
      )
    }
  }

  const now = new Date().toISOString()

  const { error: updateError } = await admin
    .from("org_processes")
    .update({
      title,
      content,
      department_id,
      updated_at: now,
    })
    .eq("id", processId)
    .eq("org_id", appUser.orgId)

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  try {
    // MVP: text-embedding-3-small accepts up to ~8,191 tokens (~6,000 words); excess is
    // silently truncated by the API. Post-MVP: chunked embedding — see generateEmbedding JSDoc.
    const embedding = await withRetry(() =>
      generateEmbedding(`${title}\n\n${content}`)
    )
    const { error: embError } = await admin
      .from("org_processes")
      .update({ embedding })
      .eq("id", processId)
      .eq("org_id", appUser.orgId)

    if (embError) throw embError
  } catch {
    await admin
      .from("org_processes")
      .update({
        title: snapshot.title,
        content: snapshot.content,
        department_id: snapshot.department_id,
        updated_at: snapshot.updated_at,
      })
      .eq("id", processId)
      .eq("org_id", appUser.orgId)

    return NextResponse.json(
      { error: "Failed to generate embedding" },
      { status: 500 }
    )
  }

  const { data: updated, error: selError } = await admin
    .from("org_processes")
    .select(
      "id, title, content, slug, department_id, created_at, updated_at"
    )
    .eq("id", processId)
    .eq("org_id", appUser.orgId)
    .single()

  if (selError) {
    return NextResponse.json({ error: selError.message }, { status: 500 })
  }

  return NextResponse.json(updated)
}
