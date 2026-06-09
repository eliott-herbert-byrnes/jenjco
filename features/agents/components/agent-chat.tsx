'use client'

import { useState } from 'react'
import { DefaultChatTransport } from 'ai'
import { useChat } from '@ai-sdk/react'
import { apiPaths } from '@/app/paths'
import { useAgentConversation } from '../hooks/use-agent-conversation'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AgentChatInput } from './agent-chat-input'
import { AgentChatMessages } from './agent-chat-messages'
import { ClearConversationButton } from './clear-conversation-button'
import { Button } from '@/components/ui/button'

export function AgentChat({ orgAgentId }: { orgAgentId: string }) {
  const [input, setInput] = useState('')
  const chatEndpoint = apiPaths.agentChat(orgAgentId)

  const { messages, setMessages, sendMessage, status, stop, error } = useChat({
    transport: new DefaultChatTransport({ api: chatEndpoint }),
  })

  const { clearConversation, clearing } = useAgentConversation({
    chatEndpoint,
    setMessages,
    stop,
    status,
  })

  const handleSubmit = () => {
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput('')
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion })
  }

  return (
    <div className="relative flex h-full w-full flex-col p-4">
      <Button
        variant="outline"
        size="default"
        aria-label="Clear conversation"
        className="absolute top-4 right-14 z-20"
      >
        Share
      </Button>
      <ClearConversationButton disabled={clearing} onConfirm={clearConversation} />
      <AgentChatMessages messages={messages} status={status} />
      {error && (
        <Alert variant="destructive" className="mt-2 shrink-0">
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      <AgentChatInput
        input={input}
        onInputChange={setInput}
        onSubmit={handleSubmit}
        onSuggestionClick={handleSuggestionClick}
        status={status}
        onStop={stop}
        showSuggestions={messages.length === 0}
      />
    </div>
  )
}
