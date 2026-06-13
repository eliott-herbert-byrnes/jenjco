-- Integration providers linked to org_processes (used by workflow detail sheet).

CREATE TABLE public.process_connections (
  process_id uuid NOT NULL REFERENCES public.org_processes(id) ON DELETE CASCADE,
  provider   text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  PRIMARY KEY (process_id, provider)
);

ALTER TABLE public.process_connections ENABLE ROW LEVEL SECURITY;

-- SELECT: user can read connections for processes in their org
CREATE POLICY "process_connections_select"
  ON public.process_connections FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_processes p
      JOIN public.users u ON u.org_id = p.org_id
      WHERE p.id = process_connections.process_id
        AND u.supabase_auth_id = auth.uid()
    )
  );

-- INSERT/UPDATE/DELETE: admin only (seed + future admin UI)
CREATE POLICY "process_connections_insert_admin"
  ON public.process_connections FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_processes p
      JOIN public.users u ON u.org_id = p.org_id
      WHERE p.id = process_connections.process_id
        AND u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "process_connections_update_admin"
  ON public.process_connections FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_processes p
      JOIN public.users u ON u.org_id = p.org_id
      WHERE p.id = process_connections.process_id
        AND u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.org_processes p
      JOIN public.users u ON u.org_id = p.org_id
      WHERE p.id = process_connections.process_id
        AND u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "process_connections_delete_admin"
  ON public.process_connections FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.org_processes p
      JOIN public.users u ON u.org_id = p.org_id
      WHERE p.id = process_connections.process_id
        AND u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );
