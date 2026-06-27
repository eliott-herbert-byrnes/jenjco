-- Denormalize department onto usage_logs for filtered analytics queries.
ALTER TABLE public.usage_logs
  ADD COLUMN IF NOT EXISTS department_id uuid
    REFERENCES public.departments(id)
    ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_usage_logs_org_dept_created
  ON public.usage_logs (org_id, department_id, created_at DESC);

-- Backfill workflow-linked rows from org_workflows via workflow_runs.
UPDATE public.usage_logs ul
SET department_id = ow.department_id
FROM public.workflow_runs wr
JOIN public.org_workflows ow
  ON ow.workflow_key = wr.workflow_key
 AND ow.org_id = wr.org_id
WHERE ul.run_id = wr.id
  AND ul.department_id IS NULL;
