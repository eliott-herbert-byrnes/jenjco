'use client'

import type { AppRole } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import type { ProcessDetailData } from '@/features/processes/types'
import { formatUpdatedAt } from '@/features/processes/utils/format'
import { Badge } from '@/components/ui/badge'
import { ProcessMarkdownBody } from '@/features/processes/components/process-markdown-body'

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
      <header className="shrink-0 border-b px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground mb-2">
            {process.title}
          </h1>
          {role === 'admin' && (
            <div className="flex shrink-0 gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="default"
                    title="Edit process (coming soon)"
                  >
                    Request Change
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Disabled for MVP</p>
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          <Badge variant="secondary" className="p-3">
            {process.departmentName ?? '—'}
          </Badge>
          <span className="mx-2 text-border">|</span>
          Updated {updatedLabel}
        </p>
      </header>
      <div className="w-full flex-1 px-6 py-6 text-left">
        <ProcessMarkdownBody content={composedContent} />
      </div>
    </div>
  )
}
