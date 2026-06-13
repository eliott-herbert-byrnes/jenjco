import { describe, expect, it } from 'vitest'

import { extractMarkdownSection } from './extract-markdown-section'

const multilineContent = `## Overview
How teams find accurate product facts, assets, and positioning without duplicating sources of truth.

## Tools
- Internal knowledge base
- Google Drive (connected org files)`

const inlineContent =
  '## Overview How teams find accurate product facts, assets, and positioning without duplicating sources of truth. ## Tools - Internal knowledge base'

describe('extractMarkdownSection', () => {
  it('extracts overview from multiline markdown', () => {
    expect(extractMarkdownSection(multilineContent, 'Overview')).toBe(
      'How teams find accurate product facts, assets, and positioning without duplicating sources of truth.'
    )
  })

  it('extracts overview from inline markdown without newlines', () => {
    expect(extractMarkdownSection(inlineContent, 'Overview')).toBe(
      'How teams find accurate product facts, assets, and positioning without duplicating sources of truth.'
    )
  })

  it('returns null when section is missing', () => {
    expect(extractMarkdownSection('## Tools\n- Item', 'Overview')).toBeNull()
  })

  it('returns null for empty content', () => {
    expect(extractMarkdownSection(null, 'Overview')).toBeNull()
    expect(extractMarkdownSection('', 'Overview')).toBeNull()
  })
})
