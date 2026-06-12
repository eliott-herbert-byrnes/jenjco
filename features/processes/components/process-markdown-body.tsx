'use client'

import { code } from '@streamdown/code'
import { remarkHeading } from 'fumadocs-core/mdx-plugins/remark-heading'
import { Streamdown } from 'streamdown'

export function ProcessMarkdownBody({ content }: { content: string }) {
  return (
    <Streamdown
      mode="static"
      plugins={{ code }}
      remarkPlugins={[[remarkHeading, { generateToc: false }]]}
      className='mb-5'
    >
      {content}
    </Streamdown>
  )
}
