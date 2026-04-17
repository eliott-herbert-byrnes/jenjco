'use client'

import { useEffect, useState } from 'react'
import { DefaultChatTransport } from 'ai'
import { useChat } from '@ai-sdk/react'
import { apiPaths } from '@/app/paths'
import { AgentChatInput } from './agent-chat-input'
import { AgentChatMessages } from './agent-chat-messages'

export function AgentChat({ orgAgentId }: { orgAgentId: string }) {
  const [input, setInput] = useState('')
  const chatEndpoint = apiPaths.agentChat(orgAgentId)

  const { messages, setMessages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: chatEndpoint }),
  })

  useEffect(() => {
    const load = async () => {
      const res = await fetch(chatEndpoint)
      if (res.ok) setMessages(await res.json())
    }
    load()
  }, [chatEndpoint, setMessages])

  const handleSubmit = () => {
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput('')
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion })
  }

  return (
    <div className="flex h-full w-full flex-col p-4">
      <AgentChatMessages messages={messages} />
      <AgentChatInput
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        onSuggestionClick={handleSuggestionClick}
        status={status}
      />
    </div>
  )
}
