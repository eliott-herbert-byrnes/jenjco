-- Phase 5: rename agent_key -> resource_key, add resource_type discriminator
ALTER TABLE public.usage_logs
  RENAME COLUMN agent_key TO resource_key;

ALTER TABLE public.usage_logs
  ADD COLUMN resource_type text NOT NULL DEFAULT 'agent'
  CHECK (resource_type IN ('agent', 'workflow'));

-- Update RLS policies to reference resource_key (they only filter by org_id, so no change needed)