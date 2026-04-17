-- 1. Unique constraint for conversations upsert pattern
ALTER TABLE public.conversations
  ADD CONSTRAINT conversations_thread_id_key UNIQUE (thread_id);

-- 2. pgvector RPC for org-scoped similarity search
CREATE OR REPLACE FUNCTION public.search_processes(
  query_embedding vector(1536),
  org_id_filter uuid,
  match_count int DEFAULT 5
)
RETURNS TABLE (id uuid, title text, content text, similarity float)
LANGUAGE sql STABLE SECURITY DEFINER
AS $$
  SELECT id, title, content,
         1 - (embedding <=> query_embedding) AS similarity
  FROM public.org_processes
  WHERE org_id = org_id_filter
    AND embedding IS NOT NULL
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;