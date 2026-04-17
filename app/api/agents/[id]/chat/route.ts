import { NextResponse } from 'next/server'
import { createUIMessageStreamResponse } from 'ai'
import { RequestContext } from '@mastra/core/request-context'
import { toAISdkStream } from '@mastra/ai-sdk'
import { toAISdkV5Messages } from '@mastra/ai-sdk/ui'
import { getServerAuth } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { getMastra } from '@/mastra'
import { logUsage } from '@/lib/usage-logger'

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
  const threadId = `${appUser.orgId}-${appUser.id}-${orgAgentId}`

  // Upsert conversation record (bumps updated_at on each message)
  await supabase.from('conversations').upsert(
    {
      org_id: appUser.orgId,
      user_id: appUser.id,
      org_agent_id: orgAgentId,
      thread_id: threadId,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'thread_id', ignoreDuplicates: false }
  )

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
        agentKey: orgAgent.agent_key,
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

  const threadId = `${appUser.orgId}-${appUser.id}-${orgAgentId}`
  const agent = mastra.getAgentById(orgAgent.agent_key)
  const memory = await agent?.getMemory()

  try {
    const result = await memory?.recall({ threadId, resourceId: appUser.id })
    return NextResponse.json(toAISdkV5Messages(result?.messages ?? []))
  } catch {
    return NextResponse.json([])
  }
}