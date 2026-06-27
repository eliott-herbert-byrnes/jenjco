-- Workflow notification settings, digest queue, and delivery logs.

CREATE TABLE public.workflow_notification_settings (
  org_workflow_id uuid PRIMARY KEY
    REFERENCES public.org_workflows(id) ON DELETE CASCADE,
  org_id uuid NOT NULL
    REFERENCES public.organizations(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT true,
  notify_on_completion boolean NOT NULL DEFAULT false,
  notify_on_error boolean NOT NULL DEFAULT false,
  team_scope text NOT NULL
    CHECK (team_scope IN ('all', 'current', 'department')),
  department_id uuid
    REFERENCES public.departments(id) ON DELETE SET NULL,
  audience text NOT NULL
    CHECK (audience IN (
      'admins_team',
      'admins_org',
      'viewers_team',
      'viewers_org',
      'all_team',
      'all_org'
    )),
  updated_by uuid
    REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT workflow_notification_settings_department_required
    CHECK (
      team_scope <> 'department'
      OR department_id IS NOT NULL
    ),
  CONSTRAINT workflow_notification_settings_event_required
    CHECK (
      NOT enabled
      OR notify_on_completion
      OR notify_on_error
    )
);

CREATE INDEX idx_workflow_notification_settings_org_id
  ON public.workflow_notification_settings(org_id);

ALTER TABLE public.workflow_notification_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_notification_settings_select"
  ON public.workflow_notification_settings FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.org_id = workflow_notification_settings.org_id
        AND u.supabase_auth_id = auth.uid()
    )
  );

CREATE POLICY "workflow_notification_settings_insert_admin"
  ON public.workflow_notification_settings FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.org_id = workflow_notification_settings.org_id
        AND u.supabase_auth_id = auth.uid()
        AND u.role = 'admin'
    )
  );

CREATE POLICY "workflow_notification_settings_update_admin"
  ON public.workflow_notification_settings FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.org_id = workflow_notification_settings.org_id
        AND u.supabase_auth_id = auth.uid()
        AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.org_id = workflow_notification_settings.org_id
        AND u.supabase_auth_id = auth.uid()
        AND u.role = 'admin'
    )
  );

CREATE POLICY "workflow_notification_settings_delete_admin"
  ON public.workflow_notification_settings FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.org_id = workflow_notification_settings.org_id
        AND u.supabase_auth_id = auth.uid()
        AND u.role = 'admin'
    )
  );

CREATE TABLE public.workflow_notification_digest_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL
    REFERENCES public.organizations(id) ON DELETE CASCADE,
  org_workflow_id uuid NOT NULL
    REFERENCES public.org_workflows(id) ON DELETE CASCADE,
  workflow_run_id uuid
    REFERENCES public.workflow_runs(id) ON DELETE SET NULL,
  recipient_email text NOT NULL,
  event_type text NOT NULL DEFAULT 'completion'
    CHECK (event_type = 'completion'),
  run_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_notification_digest_queue_lookup
  ON public.workflow_notification_digest_queue(
    recipient_email,
    org_workflow_id,
    created_at
  );

ALTER TABLE public.workflow_notification_digest_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_notification_digest_queue_select"
  ON public.workflow_notification_digest_queue FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.org_id = workflow_notification_digest_queue.org_id
        AND u.supabase_auth_id = auth.uid()
    )
  );

CREATE TABLE public.workflow_notification_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL
    REFERENCES public.organizations(id) ON DELETE CASCADE,
  org_workflow_id uuid NOT NULL
    REFERENCES public.org_workflows(id) ON DELETE CASCADE,
  workflow_run_id uuid
    REFERENCES public.workflow_runs(id) ON DELETE SET NULL,
  settings_id uuid
    REFERENCES public.workflow_notification_settings(org_workflow_id)
    ON DELETE SET NULL,
  recipient_email text NOT NULL,
  event_type text NOT NULL
    CHECK (event_type IN ('completion', 'error', 'digest', 'test')),
  delivery_mode text NOT NULL
    CHECK (delivery_mode IN ('immediate', 'digest')),
  status text NOT NULL
    CHECK (status IN ('sent', 'failed', 'skipped')),
  error_message text,
  resend_id text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_workflow_notification_deliveries_org_created
  ON public.workflow_notification_deliveries(org_id, created_at DESC);

ALTER TABLE public.workflow_notification_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workflow_notification_deliveries_select"
  ON public.workflow_notification_deliveries FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.org_id = workflow_notification_deliveries.org_id
        AND u.supabase_auth_id = auth.uid()
    )
  );
