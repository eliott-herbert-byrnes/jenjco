'use client'

import type { AppRole } from '@/lib/auth'
import { Badge } from '@/components/ui/badge'
import { ProcessMarkdownBody } from '@/features/processes/components/process-markdown-body'
import { RequestProcessChangeDialog } from '@/features/processes/components/request-process-change-dialog'
import type { ProcessDetailData } from '@/features/processes/types'
import { formatUpdatedAt } from '@/features/processes/utils/format'

export function ProcessDetail({
  process,
  composedContent,
  role,
}: {
  process: ProcessDetailData
  composedContent: string
  role: AppRole
}) {
  const updatedLabel = formatUpdatedAt(process.updatedAt)

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-y-auto">
      <header className="shrink-0 border-b px-4 py-5 sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {process.title}
        </h1>

        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Badge
            className={`p-3 ${process.departmentBadgeClass ?? 'bg-secondary text-secondary-foreground'}`}
          >
            {process.departmentName ?? '—'}
          </Badge>
          {role === 'admin' && <RequestProcessChangeDialog />}
          <span className="hidden text-sm text-muted-foreground sm:inline">
            |
          </span>
          <span className="text-sm text-muted-foreground">
            Updated {updatedLabel}
          </span>
        </div>
      </header>
      <div className="w-full flex-1 px-6 py-6 text-left">
        <ProcessMarkdownBody content={composedContent} />
      </div>
    </div>
  )
}
