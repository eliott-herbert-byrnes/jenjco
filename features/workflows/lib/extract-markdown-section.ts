/**
 * Extracts body text from a markdown `## Heading` section.
 * Returns trimmed content between the heading and the next `##` section, or null if not found.
 */
export function extractMarkdownSection(
  content: string | null | undefined,
  sectionTitle: string
): string | null {
  if (!content?.trim()) return null

  const escaped = sectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(
    `(?:^|\\n)##\\s*${escaped}\\s*\\n?([\\s\\S]*?)(?=\\s*##\\s|$)`,
    'i'
  )
  const match = content.match(pattern)
  if (!match) return null

  const text = match[1].trim()
  return text || null
}
