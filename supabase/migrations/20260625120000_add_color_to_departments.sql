ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS color text
  CHECK (color IN ('orange', 'violet', 'amber', 'sky', 'emerald'));
