-- Replace is_active with status on org_workflows and org_agents.
-- users.is_active is unrelated (account management) — leave it untouched.

-- org_workflows: add status, migrate data, drop is_active
ALTER TABLE public.org_workflows
  ADD COLUMN status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'flagged'));

UPDATE public.org_workflows
  SET status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END;

ALTER TABLE public.org_workflows DROP COLUMN is_active;

-- org_agents: same pattern, no 'flagged'
ALTER TABLE public.org_agents
  ADD COLUMN status text NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive'));

UPDATE public.org_agents
  SET status = CASE WHEN is_active THEN 'active' ELSE 'inactive' END;

ALTER TABLE public.org_agents DROP COLUMN is_active;
