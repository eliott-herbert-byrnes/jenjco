import { use } from 'react'
import { AgentChat } from '@/features/agents/components/agent-chat'

export default function AgentChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  return (
  <AgentChat orgAgentId={id} />
)
}
