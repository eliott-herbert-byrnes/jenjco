-- Aggregated run stats for the workflows hub + RPC to fetch hub rows.

CREATE OR REPLACE VIEW public.workflow_run_stats AS
SELECT
  org_id,
  workflow_key,
  COUNT(*)::bigint AS run_count,
  MAX(created_at) AS last_executed
FROM public.workflow_runs
GROUP BY org_id, workflow_key;

CREATE OR REPLACE FUNCTION public.get_workflows_hub(p_org_id uuid)
RETURNS TABLE (
  id uuid,
  workflow_key text,
  display_name text,
  description text,
  status text,
  department_id uuid,
  department_name text,
  run_count bigint,
  last_executed timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    w.id,
    w.workflow_key,
    w.display_name,
    w.description,
    w.status,
    w.department_id,
    d.name,
    COALESCE(rs.run_count, 0)::bigint,
    rs.last_executed
  FROM org_workflows w
  LEFT JOIN departments d ON d.id = w.department_id
  LEFT JOIN workflow_run_stats rs
    ON rs.workflow_key = w.workflow_key AND rs.org_id = p_org_id
  WHERE w.org_id = p_org_id
  ORDER BY w.display_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_workflows_hub(uuid) TO authenticated;
