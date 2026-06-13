/**
 * Phase 1f: demo seed for Supabase (service role).
 * Requires: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, SEED_DEMO_PASSWORD (min 6 characters),
 *   OPENAI_API_KEY (for org_processes embeddings — text-embedding-3-small).
 *
 * Creates: John Pye org, auth + app users (admin + viewer), org agents, workflow,
 * department tree (Operations → Sales & Customer Service; root siblings Finance, HR),
 * three process documents (markdown contract), and process_workflows demo links.
 *
 * Run: pnpm run seed
 */
import "dotenv/config"
import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import { formatEmbeddingForPg, generateEmbedding } from "../lib/embeddings"

type DeptRow = { id: string; parent_id: string | null }

const ORG_NAME = "John Pye"
const ORG_SLUG = "john-pye"
const ADMIN_EMAIL = "admin@johnpye.co.uk"
const VIEWER_EMAIL = "user@johnpye.co.uk"

function requireEnv(name: string): string {
  const v = process.env[name]
  if (!v?.trim()) {
    throw new Error(`Missing required env: ${name}`)
  }
  return v.trim()
}

function supabaseUrl(): string {
  const direct = process.env.SUPABASE_URL?.trim()
  if (direct) return direct
  const pub = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
  if (pub) return pub
  throw new Error("Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL")
}

async function getOrCreateAuthUser(
  admin: ReturnType<typeof createClient>["auth"]["admin"],
  email: string,
  password: string
): Promise<string> {
  const { data: list, error: listErr } = await admin.listUsers({
    page: 1,
    perPage: 1000,
  })
  if (listErr) throw listErr
  const found = list.users.find(
    (u) => u.email?.toLowerCase() === email.toLowerCase()
  )
  if (found) return found.id

  const { data, error } = await admin.createUser({
    email,
    password,
    email_confirm: true,
  })
  if (error) throw error
  if (!data.user) throw new Error(`createUser returned no user for ${email}`)
  return data.user.id
}

async function deleteDepartmentsForOrg(
  supabase: SupabaseClient,
  orgId: string
): Promise<void> {
  const { data: depts, error: selErr } = await supabase
    .from("departments")
    .select("id, parent_id")
    .eq("org_id", orgId)
  if (selErr) throw selErr
  const rows = (depts ?? []) as DeptRow[]
  if (!rows.length) return

  const children = rows.filter((d) => d.parent_id != null)
  for (const c of children) {
    const { error } = await supabase.from("departments").delete().eq("id", c.id)
    if (error) throw error
  }
  const roots = rows.filter((d) => d.parent_id == null)
  for (const r of roots) {
    const { error } = await supabase.from("departments").delete().eq("id", r.id)
    if (error) throw error
  }
}

async function main() {
  const url = supabaseUrl()
  const serviceKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY")
  const password = requireEnv("SEED_DEMO_PASSWORD")
  if (password.length < 6) {
    throw new Error(
      "SEED_DEMO_PASSWORD must be at least 6 characters (Supabase requirement)."
    )
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: orgRow, error: orgErr } = await supabase
    .from("organizations")
    .upsert({ name: ORG_NAME, slug: ORG_SLUG }, { onConflict: "slug" })
    .select("id")
    .single()
  if (orgErr) throw orgErr
  const orgId = orgRow.id as string

  const adminAuthId = await getOrCreateAuthUser(
    supabase.auth.admin,
    ADMIN_EMAIL,
    password
  )
  const viewerAuthId = await getOrCreateAuthUser(
    supabase.auth.admin,
    VIEWER_EMAIL,
    password
  )

  const { error: usersErr } = await supabase.from("users").upsert(
    [
      {
        org_id: orgId,
        supabase_auth_id: adminAuthId,
        email: ADMIN_EMAIL,
        role: "admin",
        display_name: "John Pye Admin",
        is_active: true,
      },
      {
        org_id: orgId,
        supabase_auth_id: viewerAuthId,
        email: VIEWER_EMAIL,
        role: "viewer",
        display_name: "John Pye Viewer",
        is_active: true,
      },
    ],
    { onConflict: "supabase_auth_id" }
  )
  if (usersErr) throw usersErr

  const { error: agentsErr } = await supabase.from("org_agents").upsert(
    [
      {
        org_id: orgId,
        agent_key: "process-assistant",
        display_name: "Process Assistant",
        description:
          "Answers questions about internal processes and documentation.",
        status: "active",
      },
      {
        org_id: orgId,
        agent_key: "drive-assistant",
        display_name: "Drive Assistant",
        description:
          "Search and browse files in the organisation's connected Google Drive.",
        status: "active",
      },
    ],
    { onConflict: "org_id,agent_key" }
  )
  if (agentsErr) throw agentsErr

  const { error: wfErr } = await supabase.from("org_workflows").upsert(
    [
      {
        org_id: orgId,
        workflow_key: "process-knowledge-summary",
        display_name: "Process Knowledge Summary",
        description:
          "Generates an AI summary of all process documents in the knowledge base.",
        status: "active",
        config_overrides: {
          steps: [
            {
              id: "validate-input",
              label: "Validate Input",
              description: "Schema validation",
            },
            {
              id: "gather-processes",
              label: "Gather Processes",
              description: "Retrieve process docs",
            },
            {
              id: "generate-summary",
              label: "Generate Summary",
              description: "AI-generated content",
            },
          ],
          edges: [
            { source: "validate-input", target: "gather-processes" },
            { source: "gather-processes", target: "generate-summary" },
          ],
          inputSchema: {
            type: "object",
            properties: {
              orgId: {
                type: "string",
                description: "Your organisation ID (pre-filled)",
              },
            },
            required: ["orgId"],
          },
        },
      },
      {
        org_id: orgId,
        workflow_key: "google-drive-ingest",
        display_name: "Google Drive Ingest",
        description:
          "Lists files from the organisation's connected Google Drive.",
        status: "active",
      },
    ],
    { onConflict: "org_id,workflow_key" }
  )
  if (wfErr) throw wfErr

  const { error: delProcErr } = await supabase
    .from("org_processes")
    .delete()
    .eq("org_id", orgId)
  if (delProcErr) throw delProcErr

  await deleteDepartmentsForOrg(supabase, orgId)

  const { data: opsDept, error: opsErr } = await supabase
    .from("departments")
    .insert({
      org_id: orgId,
      name: "Operations",
      parent_id: null,
      sort_order: 0,
    })
    .select("id")
    .single()
  if (opsErr) throw opsErr

  const { error: financeErr } = await supabase
    .from("departments")
    .insert({
      org_id: orgId,
      name: "Finance",
      parent_id: null,
      sort_order: 1,
    })
    .select("id")
    .single()
  if (financeErr) throw financeErr

  const { error: hrErr } = await supabase
    .from("departments")
    .insert({
      org_id: orgId,
      name: "HR",
      parent_id: null,
      sort_order: 2,
    })
    .select("id")
    .single()
  if (hrErr) throw hrErr

  const { data: salesDept, error: salesErr } = await supabase
    .from("departments")
    .insert({
      org_id: orgId,
      name: "Sales",
      parent_id: opsDept.id,
      sort_order: 0,
    })
    .select("id")
    .single()
  if (salesErr) throw salesErr

  const { data: csDept, error: csErr } = await supabase
    .from("departments")
    .insert({
      org_id: orgId,
      name: "Customer Service",
      parent_id: opsDept.id,
      sort_order: 1,
    })
    .select("id")
    .single()
  if (csErr) throw csErr

  const now = new Date().toISOString()
  const processes = [
    {
      org_id: orgId,
      department_id: salesDept.id,
      title: "Sales Pipeline",
      slug: "sales-pipeline",
      content: `## Overview
Standard stages and responsibilities for opportunities from first contact to close.

## Tools
- CRM pipeline board
- Operations escalation channel

## Step 1: Lead
Capture source, fit, and budget signals.

## Step 2: Qualified
Confirm need, timeline, and decision-makers.

## Step 3: Proposal
Align scope, pricing, and success criteria.

## Step 4: Negotiation
Resolve terms, legal, and procurement.

## Step 5: Closed won / lost
Handover to delivery or nurture.

## Escalation
Escalate deal-blockers to the Operations lead when SLA risk appears.`,
    },
    {
      org_id: orgId,
      department_id: opsDept.id,
      title: "Product Content Retrieval",
      slug: "product-content-retrieval",
      content: `## Overview
How teams find accurate product facts, assets, and positioning without duplicating sources of truth.

## Tools
- Internal knowledge base
- Google Drive (connected org files)
- Product Marketing request template (COM-12)
- ERP (canonical pricing)

## Step 1: Search the knowledge base (User)
Search the internal knowledge base by SKU or family name.

## Step 2: Request missing content (User)
If missing, open a content request with Product Marketing (template COM-12).

## Step 3: Use approved snippets only (User)
Never publish customer-facing copy without **approved** snippets from the repository.
- Link to canonical pricing in the ERP
- Do not paste estimates from email threads`,
    },
    {
      org_id: orgId,
      department_id: csDept.id,
      title: "Complaints Reporting",
      slug: "complaints-reporting",
      content: `## Overview
Consistent intake, severity, and closure for customer complaints.

## Intake
- Record verbatim customer text and channel (phone, email, chat).
- Assign **severity 1–4** using the matrix in the CS handbook.

## Resolution
- Acknowledge within SLA.
- Route product defects to Operations; billing issues to Finance workflows.

## Audit
Store final summary in the case file with owner and timestamps.`,
    },
  ]

  const { error: procErr } = await supabase.from("org_processes").insert(
    processes.map((p) => ({
      ...p,
      created_at: now,
      updated_at: now,
    }))
  )
  if (procErr) throw procErr

  const { data: processRows, error: procSelErr } = await supabase
    .from("org_processes")
    .select("id, title, slug, content")
    .eq("org_id", orgId)
  if (procSelErr) throw procSelErr

  const { data: workflowRows, error: wfSelErr } = await supabase
    .from("org_workflows")
    .select("id, workflow_key")
    .eq("org_id", orgId)
  if (wfSelErr) throw wfSelErr

  const processBySlug = Object.fromEntries(
    (processRows ?? []).map((p) => [p.slug, p.id])
  )
  const workflowByKey = Object.fromEntries(
    (workflowRows ?? []).map((w) => [w.workflow_key, w.id])
  )

  const processWorkflowLinks = [
    {
      process_slug: "product-content-retrieval",
      workflow_key: "google-drive-ingest",
      sort_order: 0,
    },
    {
      process_slug: "product-content-retrieval",
      workflow_key: "process-knowledge-summary",
      sort_order: 1,
    },
    {
      process_slug: "sales-pipeline",
      workflow_key: "process-knowledge-summary",
      sort_order: 0,
    },
  ]
    .map((link) => ({
      process_id: processBySlug[link.process_slug],
      workflow_id: workflowByKey[link.workflow_key],
      sort_order: link.sort_order,
    }))
    .filter((link) => link.process_id && link.workflow_id)

  if (processWorkflowLinks.length > 0) {
    const { error: pwErr } = await supabase
      .from("process_workflows")
      .insert(processWorkflowLinks)
    if (pwErr) throw pwErr
  }

  const processConnections = [
    { process_slug: "product-content-retrieval", providers: ["google", "notion", "browser"] },
    { process_slug: "sales-pipeline", providers: ["google", "crm"] },
    { process_slug: "complaints-reporting", providers: ["email", "phone"] },
  ]
    .flatMap(({ process_slug, providers }) =>
      providers.map((provider, sort_order) => ({
        process_id: processBySlug[process_slug],
        provider,
        sort_order,
      }))
    )
    .filter((row) => row.process_id)

  if (processConnections.length > 0) {
    const { error: pcErr } = await supabase
      .from("process_connections")
      .insert(processConnections)
    if (pcErr) throw pcErr
  }

  for (const proc of processRows ?? []) {
    const text = `${proc.title}\n\n${proc.content ?? ""}`
    const embedding = await generateEmbedding(text)
    const { error: embErr } = await supabase
      .from("org_processes")
      .update({ embedding: formatEmbeddingForPg(embedding) })
      .eq("id", proc.id)
    if (embErr) throw embErr
  }

  console.log("Seed completed successfully.")
  console.log(`  Organization: ${ORG_NAME} (${ORG_SLUG}) — ${orgId}`)
  console.log(`  Users: ${ADMIN_EMAIL} (admin), ${VIEWER_EMAIL} (viewer)`)
  console.log(
    "  Hierarchy: Operations → Sales, Customer Service; Finance; HR (root siblings)"
  )
  console.log(
    "  Processes: Sales Pipeline, Product Content Retrieval, Complaints Reporting"
  )
  console.log(
    "  process_workflows: Product Content Retrieval → Google Drive Ingest, Process Knowledge Summary; Sales Pipeline → Process Knowledge Summary"
  )
  console.log(
    "  process_connections: Product Content Retrieval → google, notion, browser; Sales Pipeline → google, crm; Complaints Reporting → email, phone"
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
