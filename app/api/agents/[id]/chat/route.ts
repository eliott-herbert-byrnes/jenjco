import { NextResponse } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createUIMessageStreamResponse } from 'ai'
import { RequestContext } from '@mastra/core/request-context'
import { toAISdkStream } from '@mastra/ai-sdk'
import { toAISdkV5Messages } from '@mastra/ai-sdk/ui'
import { getServerAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getMastra } from '@/mastra'
import { logUsage } from '@/lib/usage-logger'

/** Most recent conversation row for this user + agent (current thread). */
async function getCurrentThreadId(
  supabase: SupabaseClient,
  { orgId, userId, orgAgentId }: { orgId: string; userId: string; orgAgentId: string }
): Promise<string | null> {
  const { data } = await supabase
    .from('conversations')
    .select('thread_id')
    .eq('org_id', orgId)
    .eq('user_id', userId)
    .eq('org_agent_id', orgAgentId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return data?.thread_id ?? null
}

/**
 * Resolves the current thread or creates a new row. POST uses this so the latest
 * `updated_at` row remains the active thread (see also Phase 8 DELETE rotation).
 */
async function getOrCreateCurrentThreadId(
  supabase: SupabaseClient,
  { orgId, userId, orgAgentId }: { orgId: string; userId: string; orgAgentId: string }
): Promise<{ threadId: string; error: Error | null }> {
  const existing = await getCurrentThreadId(supabase, { orgId, userId, orgAgentId })
  if (existing) return { threadId: existing, error: null }

  const threadId = `${orgId}-${userId}-${orgAgentId}-${Date.now()}`
  const { error } = await supabase.from('conversations').insert({
    org_id: orgId,
    user_id: userId,
    org_agent_id: orgAgentId,
    thread_id: threadId,
  })
  return { threadId, error: error ? new Error(error.message) : null }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orgAgentId } = await params
  const { appUser } = await getServerAuth()
  if (!appUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()

  // Verify the agent belongs to this org
  const { data: orgAgent, error: agentErr } = await supabase
    .from('org_agents')
    .select('id, agent_key, display_name, system_prompt_override, is_active')
    .eq('id', orgAgentId)
    .eq('org_id', appUser.orgId)
    .single()

  if (agentErr || !orgAgent) {
    return NextResponse.json({ error: 'Agent not found' }, { status: 404 })
  }

  const { messages } = await req.json()

  const { threadId, error: threadErr } = await getOrCreateCurrentThreadId(supabase, {
    orgId: appUser.orgId,
    userId: appUser.id,
    orgAgentId,
  })
  if (threadErr) {
    return NextResponse.json({ error: threadErr.message }, { status: 500 })
  }

  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('thread_id', threadId)

  const mastra = getMastra()
  const agent = mastra.getAgentById(orgAgent.agent_key)
  if (!agent) return NextResponse.json({ error: 'Agent runtime not found' }, { status: 500 })

  const requestContext = new RequestContext<{ orgId: string }>()
  requestContext.set('orgId', appUser.orgId)

  const stream = await agent.stream(messages, {
    instructions: orgAgent.system_prompt_override ?? undefined,
    requestContext,
    memory: {
      thread: threadId,
      resource: appUser.id,
    },
    onFinish: async (result) => {
      await logUsage({
        orgId: appUser.orgId,
        userId: appUser.id,
        resourceKey: orgAgent.agent_key,
        tokensIn: result.usage?.inputTokens ?? 0,
        tokensOut: result.usage?.outputTokens ?? 0,
      })
    },
  })

  return createUIMessageStreamResponse({
    // Mastra stream chunks use a slightly wider finishReason union than `ai`'s UIMessageChunk.
    stream: toAISdkStream(stream, { from: 'agent' }) as Parameters<
      typeof createUIMessageStreamResponse
    >[0]['stream'],
  })
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orgAgentId } = await params
  const { appUser } = await getServerAuth()
  if (!appUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const mastra = getMastra()
  const supabase = await createClient()

  const { data: orgAgent } = await supabase
    .from('org_agents')
    .select('agent_key')
    .eq('id', orgAgentId)
    .eq('org_id', appUser.orgId)
    .single()

  if (!orgAgent) return NextResponse.json([], { status: 200 })

  const threadId = await getCurrentThreadId(supabase, {
    orgId: appUser.orgId,
    userId: appUser.id,
    orgAgentId,
  })
  if (!threadId) return NextResponse.json([], { status: 200 })

  const agent = mastra.getAgentById(orgAgent.agent_key)
  const memory = await agent?.getMemory()

  try {
    const result = await memory?.recall({ threadId, resourceId: appUser.id })
    return NextResponse.json(toAISdkV5Messages(result?.messages ?? []))
  } catch {
    return NextResponse.json([])
  }
}

/** Inserts a new conversation row so it becomes the current thread (max `updated_at`). */
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orgAgentId } = await params
  const { appUser } = await getServerAuth()
  if (!appUser) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createClient()

  const { data: orgAgent } = await supabase
    .from('org_agents')
    .select('id')
    .eq('id', orgAgentId)
    .eq('org_id', appUser.orgId)
    .single()

  if (!orgAgent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 })

  const threadId = `${appUser.orgId}-${appUser.id}-${orgAgentId}-${Date.now()}`
  const { error } = await supabase.from('conversations').insert({
    org_id: appUser.orgId,
    user_id: appUser.id,
    org_agent_id: orgAgentId,
    thread_id: threadId,
  })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ threadId })
}