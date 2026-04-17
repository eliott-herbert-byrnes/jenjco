'use client'

import { use, useEffect, useState } from 'react'
import { DefaultChatTransport, ToolUIPart } from 'ai'
import { useChat } from '@ai-sdk/react'
import { apiPaths } from '@/app/paths'
import {
  Conversation, ConversationContent, ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool'
import {
  PromptInput, PromptInputBody, PromptInputTextarea,
} from '@/components/ai-elements/prompt-input'

export default function AgentChatPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [input, setInput] = useState('')
  const chatEndpoint = apiPaths.agentChat(id)

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

  return (
    <div className="flex h-full w-full flex-col p-4">
      <Conversation className="flex-1">
        <ConversationContent>
          {messages.map(message =>
            message.parts?.map((part, i) => {
              if (part.type === 'text') {
                return (
                  <Message key={`${message.id}-${i}`} from={message.role}>
                    <MessageContent>
                      <MessageResponse>{part.text}</MessageResponse>
                    </MessageContent>
                  </Message>
                )
              }
              if (part.type?.startsWith('tool-')) {
                return (
                  <Tool key={`${message.id}-${i}`}>
                    <ToolHeader
                      type={(part as ToolUIPart).type}
                      state={(part as ToolUIPart).state || 'output-available'}
                      className="cursor-pointer"
                    />
                    <ToolContent>
                      <ToolInput input={(part as ToolUIPart).input || {}} />
                      <ToolOutput
                        output={(part as ToolUIPart).output}
                        errorText={(part as ToolUIPart).errorText}
                      />
                    </ToolContent>
                  </Tool>
                )
              }
              return null
            })
          )}
          <ConversationScrollButton />
        </ConversationContent>
      </Conversation>

      <PromptInput onSubmit={handleSubmit} className="mt-4">
        <PromptInputBody>
          <PromptInputTextarea
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Ask about a process..."
            disabled={status !== 'ready'}
          />
        </PromptInputBody>
      </PromptInput>
    </div>
  )
}