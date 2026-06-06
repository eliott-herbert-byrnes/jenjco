-- Phase 9: Workflow run ledger + usage_logs extensions for durable workflows

CREATE TABLE public.workflow_runs (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workflow_key  text NOT NULL,
  vercel_run_id text NOT NULL UNIQUE,
  status        text NOT NULL DEFAULT 'running'
                CHECK (status IN ('running', 'completed', 'failed', 'cancelled')),
  trigger       text NOT NULL DEFAULT 'manual'
                CHECK (trigger IN ('manual', 'cron', 'event')),
  input         jsonb,
  output        jsonb,
  error         text,
  tokens_in     integer NOT NULL DEFAULT 0,
  tokens_out    integer NOT NULL DEFAULT 0,
  started_by    uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz
);

CREATE TABLE public.workflow_step_runs (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id     uuid NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
  step_id    text NOT NULL,
  kind       text NOT NULL CHECK (kind IN ('deterministic', 'ai')),
  status     text NOT NULL DEFAULT 'running'
             CHECK (status IN ('running', 'completed', 'failed')),
  tokens_in  integer NOT NULL DEFAULT 0,
  tokens_out integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (run_id, step_id)
);

CREATE INDEX idx_workflow_runs_org ON public.workflow_runs(org_id, created_at DESC);

-- usage_logs: support workflow roll-ups and per-step detail rows
ALTER TABLE public.usage_logs DROP CONSTRAINT IF EXISTS usage_logs_resource_type_check;
ALTER TABLE public.usage_logs ADD CONSTRAINT usage_logs_resource_type_check
  CHECK (resource_type IN ('agent', 'workflow', 'workflow_step'));

ALTER TABLE public.usage_logs
  ADD COLUMN run_id uuid REFERENCES public.workflow_runs(id) ON DELETE SET NULL,
  ADD COLUMN step_id text;

ALTER TABLE public.usage_logs
  ALTER COLUMN user_id DROP NOT NULL;

-- RLS: read-only for authenticated (writes via service role in ledger.ts / usage.ts)
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_step_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY workflow_runs_select_same_org ON public.workflow_runs
  FOR SELECT TO authenticated
  USING (org_id = (SELECT org_id FROM public.users WHERE supabase_auth_id = auth.uid()));

CREATE POLICY workflow_step_runs_select_same_org ON public.workflow_step_runs
  FOR SELECT TO authenticated
  USING (
    run_id IN (
      SELECT id FROM public.workflow_runs
      WHERE org_id = (SELECT org_id FROM public.users WHERE supabase_auth_id = auth.uid())
    )
  );
