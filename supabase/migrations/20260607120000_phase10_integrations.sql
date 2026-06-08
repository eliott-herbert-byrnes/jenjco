-- Phase 10: Nango integrations (org credentials, connections, invocation audit)
-- Depends on: 20260411120000_phase1c_database_schema.sql, 20260411120100_phase1d_row_level_security.sql

-- -----------------------------------------------------------------------------
-- 1. org_provider_credentials (BYO OAuth client secrets — admin-only)
-- -----------------------------------------------------------------------------

CREATE TABLE public.org_provider_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  client_id text NOT NULL,
  client_secret text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, provider)
);

CREATE INDEX idx_org_provider_credentials_org_id
  ON public.org_provider_credentials(org_id);

-- -----------------------------------------------------------------------------
-- 2. org_connections (governance only — no tokens stored here)
-- -----------------------------------------------------------------------------

CREATE TABLE public.org_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  owner_type text NOT NULL DEFAULT 'org' CHECK (owner_type IN ('org', 'user')),
  connected_by_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  nango_connection_id text NOT NULL,
  status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'reconnect_required', 'revoked')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, provider, owner_type)
);

CREATE INDEX idx_org_connections_org_id
  ON public.org_connections(org_id);

-- -----------------------------------------------------------------------------
-- 3. integration_invocations (proxy audit log)
-- -----------------------------------------------------------------------------

CREATE TABLE public.integration_invocations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider text NOT NULL,
  org_connection_id uuid REFERENCES public.org_connections(id) ON DELETE SET NULL,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN ('agent', 'workflow_step', 'manual')),
  resource_key text,
  method text,
  endpoint text,
  status text NOT NULL CHECK (status IN ('success', 'error')),
  error_code text,
  duration_ms integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_integration_invocations_org_created
  ON public.integration_invocations(org_id, created_at DESC);

-- -----------------------------------------------------------------------------
-- 4. Row-Level Security
-- -----------------------------------------------------------------------------

ALTER TABLE public.org_provider_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_invocations ENABLE ROW LEVEL SECURITY;

-- org_provider_credentials: admin-only (no viewer SELECT)
CREATE POLICY "org_provider_credentials_select_admin"
  ON public.org_provider_credentials
  FOR SELECT
  TO authenticated
  USING (
    org_id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "org_provider_credentials_insert_admin"
  ON public.org_provider_credentials
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "org_provider_credentials_update_admin"
  ON public.org_provider_credentials
  FOR UPDATE
  TO authenticated
  USING (
    org_id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (
    org_id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "org_provider_credentials_delete_admin"
  ON public.org_provider_credentials
  FOR DELETE
  TO authenticated
  USING (
    org_id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );

-- org_connections: org-wide read; admin write
CREATE POLICY "org_connections_select"
  ON public.org_connections
  FOR SELECT
  TO authenticated
  USING (
    org_id = (SELECT u.org_id FROM public.users u WHERE u.supabase_auth_id = auth.uid())
  );

CREATE POLICY "org_connections_insert_admin"
  ON public.org_connections
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "org_connections_update_admin"
  ON public.org_connections
  FOR UPDATE
  TO authenticated
  USING (
    org_id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (
    org_id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "org_connections_delete_admin"
  ON public.org_connections
  FOR DELETE
  TO authenticated
  USING (
    org_id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );

-- integration_invocations: admin read-only; writes via service role
CREATE POLICY "integration_invocations_select_admin"
  ON public.integration_invocations
  FOR SELECT
  TO authenticated
  USING (
    org_id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );
