import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/database.types"

type ThreadContext = {
  orgId: string
  userId: string
  orgAgentId: string
}

/** Most recent conversation row for this user + agent (current thread). */
export async function getCurrentThreadId(
  supabase: SupabaseClient<Database>,
  { orgId, userId, orgAgentId }: ThreadContext
): Promise<string | null> {
  const { data } = await supabase
    .from("conversations")
    .select("thread_id")
    .eq("org_id", orgId)
    .eq("user_id", userId)
    .eq("org_agent_id", orgAgentId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return data?.thread_id ?? null
}

/**
 * Resolves the current thread or creates a new row. POST uses this so the latest
 * `updated_at` row remains the active thread (see also Phase 8 DELETE rotation).
 */
export async function getOrCreateCurrentThreadId(
  supabase: SupabaseClient<Database>,
  { orgId, userId, orgAgentId }: ThreadContext
): Promise<{ threadId: string; error: Error | null }> {
  const existing = await getCurrentThreadId(supabase, { orgId, userId, orgAgentId })
  if (existing) return { threadId: existing, error: null }

  const threadId = `${orgId}-${userId}-${orgAgentId}-${Date.now()}`
  const { error } = await supabase.from("conversations").insert({
    org_id: orgId,
    user_id: userId,
    org_agent_id: orgAgentId,
    thread_id: threadId,
  })
  return { threadId, error: error ? new Error(error.message) : null }
}
