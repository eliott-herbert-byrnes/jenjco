-- Phase 6: Add per-invocation metadata to usage_logs
-- duration_ms: wall-clock ms from request start to onFinish/error
-- status: 'success' (default) or 'error' — lets the Invocations view filter failures
ALTER TABLE public.usage_logs
  ADD COLUMN IF NOT EXISTS duration_ms integer,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'success'
    CHECK (status IN ('success', 'error'));

-- Supports the agent-breakdown GROUP BY in the metrics query
CREATE INDEX IF NOT EXISTS idx_usage_logs_resource_key
  ON public.usage_logs (org_id, resource_key, resource_type);