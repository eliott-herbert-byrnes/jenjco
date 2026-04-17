'use client'

import type { ChatStatus, ToolUIPart, UIMessage } from 'ai'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation'
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtHeader,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought'
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from '@/components/ai-elements/tool'
import { groupMessageParts } from '@/features/agents/lib/group-message-parts'
import { formatToolName } from '@/features/agents/lib/format-tool-name'

type AgentChatMessagesProps = {
  messages: UIMessage[]
  status: ChatStatus
}

function toolStepStatus(
  state: ToolUIPart['state']
): 'active' | 'complete' | 'pending' {
  if (state === 'input-streaming' || state === 'input-available') return 'active'
  return 'complete'
}

export function AgentChatMessages({ messages, status }: AgentChatMessagesProps) {
  const lastMessageId = messages[messages.length - 1]?.id

  return (
    <Conversation className="flex-1 pt-10">
      <ConversationContent>
        {messages.map(message => {
          const blocks = groupMessageParts(message.parts)
          const isLast = message.id === lastMessageId
          const isLive =
            isLast && (status === 'streaming' || status === 'submitted')

          return blocks.map((block, blockIndex) => {
            if (block.kind === 'text') {
              return (
                <Message
                  key={`${message.id}-t-${blockIndex}`}
                  from={message.role}
                >
                  <MessageContent>
                    <MessageResponse>{block.part.text}</MessageResponse>
                  </MessageContent>
                </Message>
              )
            }

            return (
              <ChainOfThought
                key={`${message.id}-c-${blockIndex}`}
                defaultOpen={isLive}
              >
                <ChainOfThoughtHeader>
                  {isLive ? 'Thinking...' : 'Reasoning'}
                </ChainOfThoughtHeader>
                <ChainOfThoughtContent>
                  {block.steps.map((step, stepIndex) => {
                    if (step.kind === 'reasoning') {
                      return (
                        <ChainOfThoughtStep
                          key={stepIndex}
                          label="Reasoning"
                          description={step.part.text}
                          status={
                            step.part.state === 'streaming'
                              ? 'active'
                              : 'complete'
                          }
                        />
                      )
                    }

                    const toolPart = step.part
                    const toolState = toolPart.state ?? 'output-available'
                    return (
                      <ChainOfThoughtStep
                        key={stepIndex}
                        label={formatToolName(toolPart.type)}
                        status={toolStepStatus(toolState)}
                      >
                        <Tool defaultOpen={false}>
                          <ToolHeader
                            type={toolPart.type}
                            state={toolState}
                            className="cursor-pointer"
                          />
                          <ToolContent>
                            <ToolInput input={toolPart.input ?? {}} />
                            <ToolOutput
                              output={
                                'output' in toolPart ? toolPart.output : undefined
                              }
                              errorText={
                                'errorText' in toolPart
                                  ? toolPart.errorText
                                  : undefined
                              }
                            />
                          </ToolContent>
                        </Tool>
                      </ChainOfThoughtStep>
                    )
                  })}
                </ChainOfThoughtContent>
              </ChainOfThought>
            )
          })
        })}
        <ConversationScrollButton />
      </ConversationContent>
    </Conversation>
  )
}
