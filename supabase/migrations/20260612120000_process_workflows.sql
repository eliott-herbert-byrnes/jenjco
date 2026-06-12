-- Join table linking org_processes to org_workflows (many-to-many).
-- Workflows section is composed at render time from these links.

CREATE TABLE public.process_workflows (
  process_id  uuid NOT NULL REFERENCES public.org_processes(id) ON DELETE CASCADE,
  workflow_id uuid NOT NULL REFERENCES public.org_workflows(id) ON DELETE CASCADE,
  sort_order  integer NOT NULL DEFAULT 0,
  PRIMARY KEY (process_id, workflow_id)
);

CREATE INDEX idx_process_workflows_workflow_id ON public.process_workflows (workflow_id);

ALTER TABLE public.process_workflows ENABLE ROW LEVEL SECURITY;

-- SELECT: user can read links for processes in their org
CREATE POLICY "process_workflows_select"
  ON public.process_workflows FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_processes p
      JOIN public.users u ON u.org_id = p.org_id
      WHERE p.id = process_workflows.process_id
        AND u.supabase_auth_id = auth.uid()
    )
  );

-- INSERT/UPDATE/DELETE: admin only (seed + future admin UI)
CREATE POLICY "process_workflows_insert_admin"
  ON public.process_workflows FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_processes p
      JOIN public.users u ON u.org_id = p.org_id
      WHERE p.id = process_workflows.process_id
        AND u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "process_workflows_update_admin"
  ON public.process_workflows FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_processes p
      JOIN public.users u ON u.org_id = p.org_id
      WHERE p.id = process_workflows.process_id
        AND u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_processes p
      JOIN public.users u ON u.org_id = p.org_id
      WHERE p.id = process_workflows.process_id
        AND u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "process_workflows_delete_admin"
  ON public.process_workflows FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_processes p
      JOIN public.users u ON u.org_id = p.org_id
      WHERE p.id = process_workflows.process_id
        AND u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );
