'use client'

import { code } from '@streamdown/code'
import { Streamdown } from 'streamdown'
import type { AppRole } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { Trash2 } from 'lucide-react'
import type { ProcessDetailData } from '../types'
import { formatUpdatedAt } from '../utils/format'

export function ProcessDetail({
  process,
  role,
}: {
  process: ProcessDetailData
  role: AppRole
}) {
  const updatedLabel = formatUpdatedAt(process.updatedAt)

  return (
    <div className="flex h-full w-full min-h-0 flex-col">
      <header className="shrink-0 space-y-3 border-b px-6 py-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
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
                    Edit
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Disabled for MVP</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className='bg-red-600/10 border-red-600 text-red-600 hover:text-red-600 hover:bg-red-600/15'
                    size="default"
                    title="Delete process (coming soon)"
                  >
                    <Trash2 />
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
          {process.departmentName ?? '—'}
          <span className="mx-2 text-border">·</span>
          Updated {updatedLabel}
        </p>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
        <Streamdown mode="static" plugins={{ code }}>
          {process.content}
        </Streamdown>
      </div>
    </div>
  )
}
