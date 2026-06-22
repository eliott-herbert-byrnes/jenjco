-- Analytics hub RPCs: org-level overview metrics and per-workflow run summaries.

CREATE OR REPLACE FUNCTION public.get_analytics_overview(p_org_id uuid)
RETURNS TABLE (
  total_runs_month     bigint,
  total_runs_week      bigint,
  total_runs_today     bigint,
  total_failures_month bigint,
  failure_rate_month   numeric,
  avg_run_time_ms      numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days'),
    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days'),
    COUNT(*) FILTER (WHERE created_at >= date_trunc('day', NOW())),
    COUNT(*) FILTER (
      WHERE status IN ('failed', 'cancelled')
        AND created_at >= NOW() - INTERVAL '30 days'
    ),
    CASE
      WHEN COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') = 0 THEN 0
      ELSE ROUND(
        COUNT(*) FILTER (
          WHERE status IN ('failed', 'cancelled')
            AND created_at >= NOW() - INTERVAL '30 days'
        )::numeric
        / COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days')::numeric * 100,
        1
      )
    END,
    ROUND(
      AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) * 1000) FILTER (
        WHERE completed_at IS NOT NULL
          AND created_at >= NOW() - INTERVAL '30 days'
      )
    )::numeric
  FROM public.workflow_runs
  WHERE org_id = p_org_id;
$$;

CREATE OR REPLACE FUNCTION public.get_analytics_workflow_summary(p_org_id uuid)
RETURNS TABLE (
  workflow_key      text,
  display_name      text,
  department_id     uuid,
  department_name   text,
  total_runs        bigint,
  failed_runs       bigint,
  last_run_at       timestamptz,
  avg_duration_ms   numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    wr.workflow_key,
    COALESCE(w.display_name, wr.workflow_key) AS display_name,
    w.department_id,
    d.name AS department_name,
    COUNT(*)::bigint AS total_runs,
    COUNT(*) FILTER (WHERE wr.status IN ('failed', 'cancelled'))::bigint AS failed_runs,
    MAX(wr.created_at) AS last_run_at,
    ROUND(
      AVG(EXTRACT(EPOCH FROM (wr.completed_at - wr.created_at)) * 1000) FILTER (
        WHERE wr.completed_at IS NOT NULL
      )
    )::numeric AS avg_duration_ms
  FROM public.workflow_runs wr
  LEFT JOIN public.org_workflows w
    ON w.workflow_key = wr.workflow_key
   AND w.org_id = p_org_id
  LEFT JOIN public.departments d
    ON d.id = w.department_id
  WHERE wr.org_id = p_org_id
  GROUP BY wr.workflow_key, w.display_name, w.department_id, d.name
  ORDER BY display_name;
$$;

GRANT EXECUTE ON FUNCTION public.get_analytics_overview(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_workflow_summary(uuid) TO authenticated;
