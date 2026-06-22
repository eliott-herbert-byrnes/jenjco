-- Workflow detail sheet: per-workflow aggregate stats and 7-day daily run counts.

CREATE OR REPLACE FUNCTION public.get_workflow_detail_stats(p_workflow_key text)
RETURNS TABLE (
  total_runs bigint,
  successful_runs bigint,
  failed_runs bigint,
  failure_rate numeric,
  avg_duration_ms numeric,
  latest_run_status text,
  latest_run_created_at timestamptz,
  latest_run_completed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH stats AS (
    SELECT
      COUNT(*)::bigint AS total_runs,
      COUNT(*) FILTER (WHERE status = 'completed')::bigint AS successful_runs,
      COUNT(*) FILTER (WHERE status IN ('failed', 'cancelled'))::bigint AS failed_runs,
      CASE
        WHEN COUNT(*) = 0 THEN 0
        ELSE ROUND(
          COUNT(*) FILTER (WHERE status IN ('failed', 'cancelled'))::numeric
          / COUNT(*)::numeric * 100,
          1
        )
      END AS failure_rate,
      ROUND(
        AVG(EXTRACT(EPOCH FROM (completed_at - created_at)) * 1000) FILTER (
          WHERE completed_at IS NOT NULL
        )
      )::numeric AS avg_duration_ms
    FROM public.workflow_runs
    WHERE org_id = public.current_user_org_id()
      AND workflow_key = p_workflow_key
  ),
  latest AS (
    SELECT
      status AS latest_run_status,
      created_at AS latest_run_created_at,
      completed_at AS latest_run_completed_at
    FROM public.workflow_runs
    WHERE org_id = public.current_user_org_id()
      AND workflow_key = p_workflow_key
    ORDER BY created_at DESC
    LIMIT 1
  )
  SELECT
    s.total_runs,
    s.successful_runs,
    s.failed_runs,
    s.failure_rate,
    s.avg_duration_ms,
    l.latest_run_status,
    l.latest_run_created_at,
    l.latest_run_completed_at
  FROM stats s
  LEFT JOIN latest l ON true;
$$;

CREATE OR REPLACE FUNCTION public.get_workflow_daily_runs(p_workflow_key text)
RETURNS TABLE (
  run_date date,
  successful_runs bigint,
  failed_runs bigint
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH date_spine AS (
    SELECT generate_series(
      current_date - 6,
      current_date,
      '1 day'::interval
    )::date AS run_date
  ),
  daily_counts AS (
    SELECT
      created_at::date AS run_date,
      COUNT(*) FILTER (WHERE status = 'completed')::bigint AS successful_runs,
      COUNT(*) FILTER (WHERE status IN ('failed', 'cancelled'))::bigint AS failed_runs
    FROM public.workflow_runs
    WHERE org_id = public.current_user_org_id()
      AND workflow_key = p_workflow_key
      AND created_at::date >= current_date - 6
      AND created_at::date <= current_date
    GROUP BY created_at::date
  )
  SELECT
    ds.run_date,
    COALESCE(dc.successful_runs, 0)::bigint AS successful_runs,
    COALESCE(dc.failed_runs, 0)::bigint AS failed_runs
  FROM date_spine ds
  LEFT JOIN daily_counts dc ON dc.run_date = ds.run_date
  ORDER BY ds.run_date;
$$;

GRANT EXECUTE ON FUNCTION public.get_workflow_detail_stats(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_workflow_daily_runs(text) TO authenticated;
