'use client'

import type { UIMessage } from 'ai'
import { ToolUIPart } from 'ai'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import { Message, MessageContent, MessageResponse } from '@/components/ai-elements/message'
import { Tool, ToolHeader, ToolContent, ToolInput, ToolOutput } from '@/components/ai-elements/tool'

export function AgentChatMessages({ messages }: { messages: UIMessage[] }) {
  return (
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
  )
}
