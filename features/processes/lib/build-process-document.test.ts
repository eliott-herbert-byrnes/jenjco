import { describe, expect, it } from 'vitest'
import { paths } from '@/app/paths'
import { buildProcessDocument } from './build-process-document'

const content = '## Overview\nShort paragraph.'

describe('buildProcessDocument', () => {
  it('returns trimmed content only when no workflows are linked', () => {
    expect(buildProcessDocument({ workflows: [], content })).toBe(content)
  })

  it('prepends a sorted Workflows section when links exist', () => {
    const result = buildProcessDocument({
      workflows: [
        { id: 'wf-b', display_name: 'Second', sort_order: 1 },
        { id: 'wf-a', display_name: 'First', sort_order: 0 },
      ],
      content,
    })

    expect(result).toBe(
      `## Workflows\n- [First](${paths.workflows}/wf-a)\n- [Second](${paths.workflows}/wf-b)\n\n${content}`
    )
    expect(result.startsWith('## Workflows')).toBe(true)
  })
})
