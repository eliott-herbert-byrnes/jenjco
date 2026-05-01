import type { Metadata } from 'next'
import { WorkflowIcon } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Workflows',
}

export default function WorkflowsIndexPage() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center text-muted-foreground">
      <WorkflowIcon className="size-10 opacity-40" />
      <p className="text-sm">Select a workflow to view its steps</p>
    </div>
  )
}
