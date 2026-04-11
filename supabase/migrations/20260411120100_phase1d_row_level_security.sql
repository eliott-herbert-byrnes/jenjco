-- Phase 1d: Row-Level Security (Jenjco MVP bootstrap plan)
-- Applied via Supabase SQL Editor; kept in-repo for reference and optional Supabase CLI replay.
-- Depends on: 20260411120000_phase1c_database_schema.sql
--
-- MVP auth model: org + admin users are provisioned in-house (service role / SQL).
-- No FOR INSERT policy on public.users for authenticated — invites and new rows use service role.
-- Service role bypasses RLS for admin operations (seeding, onboarding scripts).

-- -----------------------------------------------------------------------------
-- 1. Enable RLS
-- -----------------------------------------------------------------------------

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_processes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 2. organizations
-- -----------------------------------------------------------------------------

CREATE POLICY "organizations_select_own_org"
  ON public.organizations
  FOR SELECT
  TO authenticated
  USING (
    id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid()
    )
  );

CREATE POLICY "organizations_update_admin"
  ON public.organizations
  FOR UPDATE
  TO authenticated
  USING (
    id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  )
  WITH CHECK (
    id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- 3. users (no INSERT for authenticated — use service role for provisioning / invites)
-- -----------------------------------------------------------------------------

CREATE POLICY "users_select_same_org"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    org_id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid()
    )
  );

CREATE POLICY "users_update_self_or_org_admin"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (
    supabase_auth_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.users admin_u
      WHERE admin_u.supabase_auth_id = auth.uid()
        AND admin_u.role = 'admin'
        AND admin_u.org_id = users.org_id
    )
  )
  WITH CHECK (
    org_id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid()
    )
  );

CREATE POLICY "users_delete_org_admin"
  ON public.users
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.users admin_u
      WHERE admin_u.supabase_auth_id = auth.uid()
        AND admin_u.role = 'admin'
        AND admin_u.org_id = users.org_id
    )
    AND supabase_auth_id <> auth.uid()
  );

-- -----------------------------------------------------------------------------
-- 4. org_agents
-- -----------------------------------------------------------------------------

CREATE POLICY "org_agents_select"
  ON public.org_agents
  FOR SELECT
  TO authenticated
  USING (
    org_id = (SELECT u.org_id FROM public.users u WHERE u.supabase_auth_id = auth.uid())
  );

CREATE POLICY "org_agents_insert_admin"
  ON public.org_agents
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "org_agents_update_admin"
  ON public.org_agents
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

CREATE POLICY "org_agents_delete_admin"
  ON public.org_agents
  FOR DELETE
  TO authenticated
  USING (
    org_id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- 5. org_workflows
-- -----------------------------------------------------------------------------

CREATE POLICY "org_workflows_select"
  ON public.org_workflows
  FOR SELECT
  TO authenticated
  USING (
    org_id = (SELECT u.org_id FROM public.users u WHERE u.supabase_auth_id = auth.uid())
  );

CREATE POLICY "org_workflows_insert_admin"
  ON public.org_workflows
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "org_workflows_update_admin"
  ON public.org_workflows
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

CREATE POLICY "org_workflows_delete_admin"
  ON public.org_workflows
  FOR DELETE
  TO authenticated
  USING (
    org_id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- 6. departments
-- -----------------------------------------------------------------------------

CREATE POLICY "departments_select"
  ON public.departments
  FOR SELECT
  TO authenticated
  USING (
    org_id = (SELECT u.org_id FROM public.users u WHERE u.supabase_auth_id = auth.uid())
  );

CREATE POLICY "departments_insert_admin"
  ON public.departments
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "departments_update_admin"
  ON public.departments
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

CREATE POLICY "departments_delete_admin"
  ON public.departments
  FOR DELETE
  TO authenticated
  USING (
    org_id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- 7. org_processes
-- -----------------------------------------------------------------------------

CREATE POLICY "org_processes_select"
  ON public.org_processes
  FOR SELECT
  TO authenticated
  USING (
    org_id = (SELECT u.org_id FROM public.users u WHERE u.supabase_auth_id = auth.uid())
  );

CREATE POLICY "org_processes_insert_admin"
  ON public.org_processes
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );

CREATE POLICY "org_processes_update_admin"
  ON public.org_processes
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

CREATE POLICY "org_processes_delete_admin"
  ON public.org_processes
  FOR DELETE
  TO authenticated
  USING (
    org_id = (
      SELECT u.org_id
      FROM public.users u
      WHERE u.supabase_auth_id = auth.uid() AND u.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- 8. conversations
-- -----------------------------------------------------------------------------

CREATE POLICY "conversations_select_own_or_admin"
  ON public.conversations
  FOR SELECT
  TO authenticated
  USING (
    org_id = (SELECT u.org_id FROM public.users u WHERE u.supabase_auth_id = auth.uid())
    AND (
      user_id = (SELECT u.id FROM public.users u WHERE u.supabase_auth_id = auth.uid())
      OR EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.supabase_auth_id = auth.uid()
          AND u.role = 'admin'
          AND u.org_id = conversations.org_id
      )
    )
  );

CREATE POLICY "conversations_insert_self"
  ON public.conversations
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (SELECT u.org_id FROM public.users u WHERE u.supabase_auth_id = auth.uid())
    AND user_id = (SELECT u.id FROM public.users u WHERE u.supabase_auth_id = auth.uid())
  );

CREATE POLICY "conversations_update_own_or_admin"
  ON public.conversations
  FOR UPDATE
  TO authenticated
  USING (
    org_id = (SELECT u.org_id FROM public.users u WHERE u.supabase_auth_id = auth.uid())
    AND (
      user_id = (SELECT u.id FROM public.users u WHERE u.supabase_auth_id = auth.uid())
      OR EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.supabase_auth_id = auth.uid()
          AND u.role = 'admin'
          AND u.org_id = conversations.org_id
      )
    )
  )
  WITH CHECK (
    org_id = (SELECT u.org_id FROM public.users u WHERE u.supabase_auth_id = auth.uid())
  );

CREATE POLICY "conversations_delete_own_or_admin"
  ON public.conversations
  FOR DELETE
  TO authenticated
  USING (
    org_id = (SELECT u.org_id FROM public.users u WHERE u.supabase_auth_id = auth.uid())
    AND (
      user_id = (SELECT u.id FROM public.users u WHERE u.supabase_auth_id = auth.uid())
      OR EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.supabase_auth_id = auth.uid()
          AND u.role = 'admin'
          AND u.org_id = conversations.org_id
      )
    )
  );

-- -----------------------------------------------------------------------------
-- 9. usage_logs
-- -----------------------------------------------------------------------------

CREATE POLICY "usage_logs_select_own_or_admin"
  ON public.usage_logs
  FOR SELECT
  TO authenticated
  USING (
    org_id = (SELECT u.org_id FROM public.users u WHERE u.supabase_auth_id = auth.uid())
    AND (
      user_id = (SELECT u.id FROM public.users u WHERE u.supabase_auth_id = auth.uid())
      OR EXISTS (
        SELECT 1
        FROM public.users u
        WHERE u.supabase_auth_id = auth.uid()
          AND u.role = 'admin'
          AND u.org_id = usage_logs.org_id
      )
    )
  );

CREATE POLICY "usage_logs_insert_self"
  ON public.usage_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (SELECT u.org_id FROM public.users u WHERE u.supabase_auth_id = auth.uid())
    AND user_id = (SELECT u.id FROM public.users u WHERE u.supabase_auth_id = auth.uid())
  );
