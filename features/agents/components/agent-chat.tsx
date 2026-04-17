'use client'

import { useEffect, useState } from 'react'
import { DefaultChatTransport } from 'ai'
import { useChat } from '@ai-sdk/react'
import { toast } from 'sonner'
import { apiPaths } from '@/app/paths'
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

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()
      ; (async () => {
        try {
          const res = await fetch(chatEndpoint, { signal: controller.signal })
          if (!ignore && res.ok) setMessages(await res.json())
        } catch {
          /* aborted or network */
        }
      })()
    return () => {
      ignore = true
      controller.abort()
    }
  }, [chatEndpoint, setMessages])

  const handleSubmit = () => {
    if (!input.trim()) return
    sendMessage({ text: input })
    setInput('')
  }

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion })
  }

  const handleClearConversation = async () => {
    try {
      if (status === 'streaming' || status === 'submitted') stop()
      const res = await fetch(chatEndpoint, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to clear')
      setMessages([])
      toast.success('Conversation cleared')
    } catch (e) {
      const message =
        e instanceof Error ? e.message : 'Could not clear conversation'
      toast.error(message)
      throw e instanceof Error ? e : new Error(message)
    }
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
      <ClearConversationButton onConfirm={handleClearConversation} />
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
