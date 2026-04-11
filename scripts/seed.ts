/**
 * Phase 1f: demo seed for Supabase (service role).
 * Requires: SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, SEED_DEMO_PASSWORD (min 6 characters).
 *
 * Creates: John Pye org, auth + app users (admin + viewer), org agents, workflow,
 * department tree (Operations → Sales & Customer Service), and three process documents.
 *
 * Run: pnpm run seed
 */
import 'dotenv/config';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

type DeptRow = { id: string; parent_id: string | null };

const ORG_NAME = 'John Pye';
const ORG_SLUG = 'john-pye';
const ADMIN_EMAIL = 'admin@johnpye.co.uk';
const VIEWER_EMAIL = 'user@johnpye.co.uk';

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v?.trim()) {
    throw new Error(`Missing required env: ${name}`);
  }
  return v.trim();
}

function supabaseUrl(): string {
  const direct = process.env.SUPABASE_URL?.trim();
  if (direct) return direct;
  const pub = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  if (pub) return pub;
  throw new Error('Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL');
}

async function getOrCreateAuthUser(
  admin: ReturnType<typeof createClient>['auth']['admin'],
  email: string,
  password: string
): Promise<string> {
  const { data: list, error: listErr } = await admin.listUsers({ page: 1, perPage: 1000 });
  if (listErr) throw listErr;
  const found = list.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (found) return found.id;

  const { data, error } = await admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  if (!data.user) throw new Error(`createUser returned no user for ${email}`);
  return data.user.id;
}

async function deleteDepartmentsForOrg(supabase: SupabaseClient, orgId: string): Promise<void> {
  const { data: depts, error: selErr } = await supabase
    .from('departments')
    .select('id, parent_id')
    .eq('org_id', orgId);
  if (selErr) throw selErr;
  const rows = (depts ?? []) as DeptRow[];
  if (!rows.length) return;

  const children = rows.filter((d) => d.parent_id != null);
  for (const c of children) {
    const { error } = await supabase.from('departments').delete().eq('id', c.id);
    if (error) throw error;
  }
  const roots = rows.filter((d) => d.parent_id == null);
  for (const r of roots) {
    const { error } = await supabase.from('departments').delete().eq('id', r.id);
    if (error) throw error;
  }
}

async function main() {
  const url = supabaseUrl();
  const serviceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY');
  const password = requireEnv('SEED_DEMO_PASSWORD');
  if (password.length < 6) {
    throw new Error('SEED_DEMO_PASSWORD must be at least 6 characters (Supabase requirement).');
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: orgRow, error: orgErr } = await supabase
    .from('organizations')
    .upsert({ name: ORG_NAME, slug: ORG_SLUG }, { onConflict: 'slug' })
    .select('id')
    .single();
  if (orgErr) throw orgErr;
  const orgId = orgRow.id as string;

  const adminAuthId = await getOrCreateAuthUser(supabase.auth.admin, ADMIN_EMAIL, password);
  const viewerAuthId = await getOrCreateAuthUser(supabase.auth.admin, VIEWER_EMAIL, password);

  const { error: usersErr } = await supabase.from('users').upsert(
    [
      {
        org_id: orgId,
        supabase_auth_id: adminAuthId,
        email: ADMIN_EMAIL,
        role: 'admin',
        display_name: 'John Pye Admin',
      },
      {
        org_id: orgId,
        supabase_auth_id: viewerAuthId,
        email: VIEWER_EMAIL,
        role: 'viewer',
        display_name: 'John Pye Viewer',
      },
    ],
    { onConflict: 'supabase_auth_id' }
  );
  if (usersErr) throw usersErr;

  const { error: agentsErr } = await supabase.from('org_agents').upsert(
    [
      {
        org_id: orgId,
        agent_key: 'weather-agent',
        display_name: 'Weather Assistant',
        description: 'Forecasts and activity planning using live weather data.',
        is_active: true,
      },
      {
        org_id: orgId,
        agent_key: 'process-assistant',
        display_name: 'Process Assistant',
        description: 'Answers questions about internal processes and documentation.',
        is_active: true,
      },
    ],
    { onConflict: 'org_id,agent_key' }
  );
  if (agentsErr) throw agentsErr;

  const { error: wfErr } = await supabase.from('org_workflows').upsert(
    {
      org_id: orgId,
      workflow_key: 'weather-workflow',
      display_name: 'Weather planning workflow',
      description: 'Fetch forecast and suggest activities for a city.',
      is_active: true,
    },
    { onConflict: 'org_id,workflow_key' }
  );
  if (wfErr) throw wfErr;

  const { error: delProcErr } = await supabase.from('org_processes').delete().eq('org_id', orgId);
  if (delProcErr) throw delProcErr;

  await deleteDepartmentsForOrg(supabase, orgId);

  const { data: opsDept, error: opsErr } = await supabase
    .from('departments')
    .insert({
      org_id: orgId,
      name: 'Operations',
      parent_id: null,
      sort_order: 0,
    })
    .select('id')
    .single();
  if (opsErr) throw opsErr;

  const { data: salesDept, error: salesErr } = await supabase
    .from('departments')
    .insert({
      org_id: orgId,
      name: 'Sales',
      parent_id: opsDept.id,
      sort_order: 0,
    })
    .select('id')
    .single();
  if (salesErr) throw salesErr;

  const { data: csDept, error: csErr } = await supabase
    .from('departments')
    .insert({
      org_id: orgId,
      name: 'Customer Service',
      parent_id: opsDept.id,
      sort_order: 1,
    })
    .select('id')
    .single();
  if (csErr) throw csErr;

  const now = new Date().toISOString();
  const processes = [
    {
      org_id: orgId,
      department_id: salesDept.id,
      title: 'Sales Pipeline',
      slug: 'sales-pipeline',
      content: `# Sales Pipeline

## Purpose
Standard stages and responsibilities for opportunities from first contact to close.

## Stages
1. **Lead** — Capture source, fit, and budget signals.
2. **Qualified** — Confirm need, timeline, and decision-makers.
3. **Proposal** — Align scope, pricing, and success criteria.
4. **Negotiation** — Resolve terms, legal, and procurement.
5. **Closed won / lost** — Handover to delivery or nurture.

## Escalation
Escalate deal-blockers to the Operations lead when SLA risk appears.`,
    },
    {
      org_id: orgId,
      department_id: opsDept.id,
      title: 'Product Content Retrieval',
      slug: 'product-content-retrieval',
      content: `# Product Content Retrieval

## Purpose
How teams find accurate product facts, assets, and positioning without duplicating sources of truth.

## Steps
1. Search the internal knowledge base by SKU or family name.
2. If missing, open a content request with Product Marketing (template COM-12).
3. Never publish customer-facing copy without **approved** snippets from the repository.

## Notes
Link to canonical pricing in the ERP; do not paste estimates from email threads.`,
    },
    {
      org_id: orgId,
      department_id: csDept.id,
      title: 'Complaints Reporting',
      slug: 'complaints-reporting',
      content: `# Complaints Reporting

## Purpose
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
  ];

  const { error: procErr } = await supabase.from('org_processes').insert(
    processes.map((p) => ({
      ...p,
      created_at: now,
      updated_at: now,
    }))
  );
  if (procErr) throw procErr;

  console.log('Seed completed successfully.');
  console.log(`  Organization: ${ORG_NAME} (${ORG_SLUG}) — ${orgId}`);
  console.log(`  Users: ${ADMIN_EMAIL} (admin), ${VIEWER_EMAIL} (viewer)`);
  console.log('  Hierarchy: Operations → Sales, Customer Service');
  console.log('  Processes: Sales Pipeline, Product Content Retrieval, Complaints Reporting');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
