-- Adds optional department association to org_workflows.
-- Nullable: existing workflows are unaffected.
-- Junction table may replace this in a future phase if many:many is needed.
ALTER TABLE public.org_workflows
  ADD COLUMN IF NOT EXISTS department_id UUID
    REFERENCES public.departments(id)
    ON DELETE SET NULL;
