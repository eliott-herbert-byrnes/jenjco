'use client'

import type { ChatStatus } from 'ai'
import {
  PromptInput,
  PromptInputBody,
  PromptInputButton,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input'
import { PaperclipIcon, GlobeIcon, MicIcon } from 'lucide-react'
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion'

const suggestions = ['What processes are available for this organisation?']

export type AgentChatInputProps = {
  input: string
  onInputChange: (value: string) => void
  onSubmit: () => void
  onSuggestionClick: (suggestion: string) => void
  status: ChatStatus
  onStop: () => void
  /** When false, starter suggestions are hidden (e.g. after the first turn). */
  showSuggestions: boolean
}

export function AgentChatInput({
  input,
  onInputChange,
  onSubmit,
  onSuggestionClick,
  status,
  onStop,
  showSuggestions,
}: AgentChatInputProps) {
  return (
    <div className="mt-4">
      {showSuggestions && (
        <Suggestions>
          {suggestions.map(suggestion => (
            <Suggestion
              className="border-amber-600 bg-amber-600/5 p-4 text-amber-600 hover:border-amber-700 hover:bg-amber-600/5 hover:text-amber-700"
              key={suggestion}
              onClick={onSuggestionClick}
              suggestion={suggestion}
            />
          ))}
        </Suggestions>
      )}

      <PromptInput onSubmit={onSubmit} className={showSuggestions ? 'mt-4' : undefined}>
        <PromptInputBody>
          <PromptInputTextarea
            value={input}
            onChange={e => onInputChange(e.target.value)}
            placeholder="Ask about a process..."
            className="text-sm placeholder:text-sm"
          />
        </PromptInputBody>
        <PromptInputFooter>
          <PromptInputTools>
            <PromptInputButton tooltip="Attach files">
              <PaperclipIcon size={16} />
            </PromptInputButton>
            <PromptInputButton tooltip={{ content: 'Search the web', shortcut: '⌘K' }}>
              <GlobeIcon size={16} />
            </PromptInputButton>
            <PromptInputButton
              tooltip={{ content: 'Voice input', shortcut: '⌘M', side: 'bottom' }}
            >
              <MicIcon size={16} />
            </PromptInputButton>
          </PromptInputTools>
          <PromptInputSubmit status={status} onStop={onStop} />
        </PromptInputFooter>
      </PromptInput>
    </div>
  )
}
