-- Phase 12: User management columns and update enforcement trigger
-- Depends on: 20260411120100_phase1d_row_level_security.sql
--
-- Adds is_active / invited_at for deactivate-reactivate and invite flows.
-- BEFORE UPDATE trigger restricts authenticated updates:
--   self: display_name only
--   org admin (other rows): role, display_name, is_active
--   immutable for all authenticated actors: org_id, email, supabase_auth_id, invited_at, created_at, id
-- Service role bypasses trigger (seed, invite/deactivate/reactivate server actions).

-- -----------------------------------------------------------------------------
-- 1a. Columns
-- -----------------------------------------------------------------------------

ALTER TABLE public.users
  ADD COLUMN is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN invited_at timestamptz;

COMMENT ON COLUMN public.users.is_active IS
  'When false, user cannot sign in; sessions invalidated on deactivate.';

COMMENT ON COLUMN public.users.invited_at IS
  'Set when admin invites user; NULL for seeded/provisioned users.';

-- -----------------------------------------------------------------------------
-- 1b. BEFORE UPDATE trigger — block self role / is_active escalation
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.enforce_users_update_rules()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  actor_role text;
  actor_org uuid;
  is_self boolean;
BEGIN
  -- Service role (admin API, seed): bypass column restrictions
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  is_self := (OLD.supabase_auth_id = auth.uid());

  IF is_self THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.is_active IS DISTINCT FROM OLD.is_active
       OR NEW.org_id IS DISTINCT FROM OLD.org_id
       OR NEW.email IS DISTINCT FROM OLD.email
       OR NEW.supabase_auth_id IS DISTINCT FROM OLD.supabase_auth_id
       OR NEW.invited_at IS DISTINCT FROM OLD.invited_at
       OR NEW.created_at IS DISTINCT FROM OLD.created_at
       OR NEW.id IS DISTINCT FROM OLD.id THEN
      RAISE EXCEPTION 'users_self_update_forbidden';
    END IF;
    RETURN NEW;
  END IF;

  SELECT u.role, u.org_id INTO actor_role, actor_org
  FROM public.users u
  WHERE u.supabase_auth_id = auth.uid();

  IF actor_role IS NULL OR actor_role <> 'admin' OR actor_org <> OLD.org_id THEN
    RAISE EXCEPTION 'users_admin_update_forbidden';
  END IF;

  IF NEW.org_id IS DISTINCT FROM OLD.org_id
     OR NEW.email IS DISTINCT FROM OLD.email
     OR NEW.supabase_auth_id IS DISTINCT FROM OLD.supabase_auth_id
     OR NEW.invited_at IS DISTINCT FROM OLD.invited_at
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     OR NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'users_immutable_fields';
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER users_enforce_update_rules
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_users_update_rules();
