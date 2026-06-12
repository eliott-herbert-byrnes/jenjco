import { paths } from '@/app/paths'

export type LinkedWorkflow = {
  id: string
  display_name: string
  sort_order: number
}

export function buildProcessDocument({
  workflows,
  content,
}: {
  workflows: LinkedWorkflow[]
  content: string
}): string {
  const trimmed = content.trim()
  const workflowSection =
    workflows.length === 0
      ? ''
      : `## Workflows\n${workflows
          .toSorted((a, b) => a.sort_order - b.sort_order)
          .map((w) => `- [${w.display_name}](${paths.workflows}/${w.id})`)
          .join('\n')}\n\n`

  return `${workflowSection}${trimmed}`
}
