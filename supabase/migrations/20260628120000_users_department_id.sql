-- User team assignment: optional department membership for team-scoped notifications
-- Depends on: 20260609120000_phase12_users_management.sql, departments table

ALTER TABLE public.users
  ADD COLUMN department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.users.department_id IS
  'Optional team/department assignment; set by org admin for active users only.';

CREATE INDEX idx_users_department_id ON public.users (department_id)
  WHERE department_id IS NOT NULL;

-- Extend enforce_users_update_rules: admins may set department_id on other users;
-- users cannot change their own department_id.
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
  IF auth.uid() IS NULL THEN
    RETURN NEW;
  END IF;

  is_self := (OLD.supabase_auth_id = auth.uid());

  IF is_self THEN
    IF NEW.role IS DISTINCT FROM OLD.role
       OR NEW.is_active IS DISTINCT FROM OLD.is_active
       OR NEW.department_id IS DISTINCT FROM OLD.department_id
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
