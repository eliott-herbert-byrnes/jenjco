-- Phase 1c: Database schema (Jenjco MVP bootstrap plan)
-- Applied via Supabase SQL Editor; kept in-repo for reference and optional Supabase CLI replay.
-- Row-Level Security: 20260411120100_phase1d_row_level_security.sql

-- -----------------------------------------------------------------------------
-- 1. Extensions
-- -----------------------------------------------------------------------------

CREATE EXTENSION IF NOT EXISTS vector;

-- -----------------------------------------------------------------------------
-- 2. Tables (dependency order)
-- -----------------------------------------------------------------------------

CREATE TABLE public.organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  supabase_auth_id uuid NOT NULL UNIQUE REFERENCES auth.users (id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'viewer')),
  display_name text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, email)
);

CREATE TABLE public.org_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  agent_key text NOT NULL,
  display_name text NOT NULL,
  description text,
  avatar_url text,
  system_prompt_override text,
  enabled_tools jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, agent_key)
);

CREATE TABLE public.org_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  workflow_key text NOT NULL,
  display_name text NOT NULL,
  description text,
  config_overrides jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, workflow_key)
);

CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  name text NOT NULL,
  parent_id uuid REFERENCES public.departments (id) ON DELETE SET NULL,
  sort_order integer NOT NULL DEFAULT 0
);

CREATE TABLE public.org_processes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments (id) ON DELETE CASCADE,
  title text NOT NULL,
  slug text NOT NULL,
  content text,
  embedding vector(1536),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (org_id, slug)
);

CREATE TABLE public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  org_agent_id uuid NOT NULL REFERENCES public.org_agents (id) ON DELETE CASCADE,
  thread_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users (id) ON DELETE CASCADE,
  agent_key text,
  tokens_in integer NOT NULL DEFAULT 0,
  tokens_out integer NOT NULL DEFAULT 0,
  cost_estimate numeric,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. Indexes (org_id + HNSW on embeddings)
-- -----------------------------------------------------------------------------

CREATE INDEX idx_users_org_id ON public.users (org_id);
CREATE INDEX idx_users_supabase_auth_id ON public.users (supabase_auth_id);

CREATE INDEX idx_org_agents_org_id ON public.org_agents (org_id);

CREATE INDEX idx_org_workflows_org_id ON public.org_workflows (org_id);

CREATE INDEX idx_departments_org_id ON public.departments (org_id);
CREATE INDEX idx_departments_parent_id ON public.departments (parent_id);

CREATE INDEX idx_org_processes_org_id ON public.org_processes (org_id);
CREATE INDEX idx_org_processes_department_id ON public.org_processes (department_id);

CREATE INDEX idx_conversations_org_id ON public.conversations (org_id);
CREATE INDEX idx_conversations_user_id ON public.conversations (user_id);
CREATE INDEX idx_conversations_org_agent_id ON public.conversations (org_agent_id);
CREATE INDEX idx_conversations_thread_id ON public.conversations (org_id, thread_id);

CREATE INDEX idx_usage_logs_org_id ON public.usage_logs (org_id);
CREATE INDEX idx_usage_logs_user_id ON public.usage_logs (user_id);
CREATE INDEX idx_usage_logs_created_at ON public.usage_logs (org_id, created_at DESC);

CREATE INDEX idx_org_processes_embedding_hnsw
  ON public.org_processes
  USING hnsw (embedding vector_cosine_ops);
