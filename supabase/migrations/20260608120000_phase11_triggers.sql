-- Phase 11: Workflow triggers (schedule_cron, webhook idempotency, invocation trigger types)
-- Depends on: 20260606140000_phase9_workflow_runs.sql, 20260607120000_phase10_integrations.sql

-- -----------------------------------------------------------------------------
-- 1a. schedule_cron on org_workflows
-- -----------------------------------------------------------------------------

ALTER TABLE public.org_workflows
  ADD COLUMN schedule_cron text;

COMMENT ON COLUMN public.org_workflows.schedule_cron IS
  'Nullable Vercel cron expression. No admin UI in PR5; temporary until workflow_triggers table. Set manually in DB to enable scheduled runs.';

-- -----------------------------------------------------------------------------
-- 1b. Extend integration_invocations.trigger_type
-- -----------------------------------------------------------------------------

ALTER TABLE public.integration_invocations
  DROP CONSTRAINT IF EXISTS integration_invocations_trigger_type_check;

ALTER TABLE public.integration_invocations
  ADD CONSTRAINT integration_invocations_trigger_type_check
  CHECK (trigger_type IN ('agent', 'workflow_step', 'manual', 'cron', 'event'));

-- -----------------------------------------------------------------------------
-- 1c. Webhook idempotency table (service-role writes only; no RLS)
-- -----------------------------------------------------------------------------

CREATE TABLE public.webhook_deliveries (
  idempotency_key text PRIMARY KEY,
  source text NOT NULL DEFAULT 'nango',
  processed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_deliveries_processed
  ON public.webhook_deliveries(processed_at DESC);
