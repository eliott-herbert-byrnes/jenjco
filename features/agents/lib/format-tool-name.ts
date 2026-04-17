import type { ToolUIPart } from 'ai'

/**
 * Strip the leading `tool-` prefix from a `ToolUIPart['type']` string so it
 * can be displayed as a friendly label. Mirrors the derivation in
 * `components/ai-elements/tool.tsx` (`ToolHeader`).
 */
export function formatToolName(type: ToolUIPart['type']): string {
  return type.split('-').slice(1).join('-')
}
