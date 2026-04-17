import type { ToolUIPart, UIMessage } from 'ai'

type MessagePart = NonNullable<UIMessage['parts']>[number]
type ReasoningPart = Extract<MessagePart, { type: 'reasoning' }>
type TextPart = Extract<MessagePart, { type: 'text' }>

export type CoTStep =
  | { kind: 'tool'; part: ToolUIPart }
  | { kind: 'reasoning'; part: ReasoningPart }

export type MessageBlock =
  | { kind: 'text'; part: TextPart }
  | { kind: 'chain'; steps: CoTStep[] }

/**
 * Convert a flat `message.parts` array into renderable blocks.
 *
 * Consecutive non-text parts (`reasoning` + `tool-*`) that precede each text
 * part are folded into a single `chain` block, so we can render them as one
 * Chain-of-Thought group nested above the assistant's reply. A trailing run
 * of non-text parts (still streaming, no final text yet) is also flushed as
 * its own chain so the user sees thinking-in-progress.
 */
export function groupMessageParts(
  parts: UIMessage['parts'] | undefined
): MessageBlock[] {
  const blocks: MessageBlock[] = []
  let buffer: CoTStep[] = []

  const flush = () => {
    if (buffer.length === 0) return
    blocks.push({ kind: 'chain', steps: buffer })
    buffer = []
  }

  for (const part of parts ?? []) {
    if (part.type === 'text') {
      flush()
      blocks.push({ kind: 'text', part: part as TextPart })
      continue
    }
    if (part.type === 'reasoning') {
      buffer.push({ kind: 'reasoning', part: part as ReasoningPart })
      continue
    }
    if (typeof part.type === 'string' && part.type.startsWith('tool-')) {
      buffer.push({ kind: 'tool', part: part as ToolUIPart })
    }
  }

  flush()
  return blocks
}
