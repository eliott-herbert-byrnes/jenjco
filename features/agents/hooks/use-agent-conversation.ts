'use client'

import type { ChatStatus } from 'ai'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { UIMessage } from '@ai-sdk/react'

export type UseAgentConversationOptions = {
  chatEndpoint: string
  setMessages: (messages: UIMessage[]) => void
  stop: () => void
  status: ChatStatus
}

export function useAgentConversation({
  chatEndpoint,
  setMessages,
  stop,
  status,
}: UseAgentConversationOptions) {
  const [clearing, setClearing] = useState(false)

  const loadConversation = useCallback(async () => {
    const res = await fetch(chatEndpoint)
    if (res.ok) setMessages(await res.json())
  }, [chatEndpoint, setMessages])

  useEffect(() => {
    let ignore = false
    const controller = new AbortController()
    ;(async () => {
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

  const clearConversation = useCallback(async () => {
    setClearing(true)
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
    } finally {
      setClearing(false)
    }
  }, [chatEndpoint, setMessages, stop, status])

  return { loadConversation, clearConversation, clearing }
}
