-- Add aggregated integration providers to get_workflows_hub for dashboard/workflow UI.
-- Postgres cannot change a function's return type via CREATE OR REPLACE.

DROP FUNCTION IF EXISTS public.get_workflows_hub(uuid);

CREATE FUNCTION public.get_workflows_hub(p_org_id uuid)
RETURNS TABLE (
  id uuid,
  workflow_key text,
  display_name text,
  description text,
  status text,
  department_id uuid,
  department_name text,
  run_count bigint,
  last_executed timestamptz,
  providers text[]
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
    rs.last_executed,
    COALESCE(
      ARRAY(
        SELECT DISTINCT pc.provider
        FROM process_workflows pw
        JOIN org_processes op ON op.id = pw.process_id
        JOIN process_connections pc ON pc.process_id = op.id
        WHERE pw.workflow_id = w.id
        ORDER BY pc.provider
      ),
      '{}'::text[]
    ) AS providers
  FROM org_workflows w
  LEFT JOIN departments d ON d.id = w.department_id
  LEFT JOIN workflow_run_stats rs
    ON rs.workflow_key = w.workflow_key AND rs.org_id = p_org_id
  WHERE w.org_id = p_org_id
  ORDER BY w.display_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_workflows_hub(uuid) TO authenticated;
