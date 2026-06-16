-- Add has_output flag to org_workflows for Output section visibility in workflow canvas UI.

ALTER TABLE public.org_workflows
  ADD COLUMN has_output boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.org_workflows.has_output IS
  'When true, the workflow canvas shows an Output section with the final step. Set manually until admin UI exists.';
