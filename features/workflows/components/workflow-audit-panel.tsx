'use client'

import { ChevronDownIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Separator } from '@/components/ui/separator'
import { formatDuration } from '@/features/workflows/lib/format-duration'
import { cn } from '@/lib/utils'
import { AUDIT_LOGS_PAGE_SIZE, useAuditLogs } from '../hooks/use-audit-logs'
import type { WorkflowRunRow, WorkflowStepRunRow } from '../types'

export type WorkflowAuditPanelProps = {
  workflowKey: string
  running: boolean
}

type RunStatusLabel = 'success' | 'failed' | 'running'

function displayRunStatus(status: string): RunStatusLabel {
  if (status === 'completed') return 'success'
  if (status === 'failed' || status === 'cancelled') return 'failed'
  return 'running'
}

function runStatusBadgeVariant(status: RunStatusLabel) {
  if (status === 'success') return 'default' as const
  if (status === 'failed') return 'destructive' as const
  return 'secondary' as const
}

function groupRunsByDay(runs: WorkflowRunRow[]): [string, WorkflowRunRow[]][] {
  const groups = new Map<string, WorkflowRunRow[]>()

  for (const run of runs) {
    const day = new Date(run.created_at).toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
    const existing = groups.get(day) ?? []
    existing.push(run)
    groups.set(day, existing)
  }

  return [...groups.entries()]
}

function fixSuggestion(reason: string, description: string): string {
  const text = `${reason} ${description}`.toLowerCase()
  if (text.includes('timeout')) return 'Retry the workflow'
  if (text.includes('auth') || text.includes('permission')) return 'Contact support'
  return 'Restart or contact support'
}

function RunRowSkeleton() {
  return (
    <div className="rounded-lg border px-3 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="h-4 w-16 rounded bg-muted animate-pulse" />
        <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
        <div className="h-5 w-14 rounded-full bg-muted animate-pulse" />
        <div className="ml-auto h-4 w-24 rounded bg-muted animate-pulse" />
      </div>
    </div>
  )
}

function StepRunRow({ step }: { step: WorkflowStepRunRow }) {
  const failed = step.status === 'failed'
  const error = step.error

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
        >
          <span className="font-mono">{step.step_id}</span>
          <Badge variant={failed ? 'destructive' : 'outline'}>{step.status}</Badge>
        </button>
      </PopoverTrigger>
      <PopoverContent side="left" align="start" className="w-72">
        <PopoverHeader>
          <PopoverTitle>{step.step_id}</PopoverTitle>
          <PopoverDescription>Status: {step.status}</PopoverDescription>
        </PopoverHeader>
        {failed && error ? (
          <div className="space-y-2 text-xs">
            <div>
              <p className="font-medium text-foreground">Reason</p>
              <p className="text-muted-foreground">{error.reason}</p>
            </div>
            {error.description ? (
              <div>
                <p className="font-medium text-foreground">Description</p>
                <p className="text-muted-foreground">{error.description}</p>
              </div>
            ) : null}
            <div>
              <p className="font-medium text-foreground">Suggested fix</p>
              <p className="text-muted-foreground">
                {fixSuggestion(error.reason, error.description)}
              </p>
            </div>
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  )
}

function RunRow({
  run,
  open,
  onOpenChange,
}: {
  run: WorkflowRunRow
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const statusLabel = displayRunStatus(run.status)

  return (
    <Collapsible open={open} onOpenChange={onOpenChange} className="rounded-lg border">
      <CollapsibleTrigger className="flex w-full flex-wrap items-center gap-2 px-3 py-3 text-left text-sm">
        <span className="font-mono text-xs">{run.id.slice(0, 8)}</span>
          <span className="text-muted-foreground text-xs">
            {formatDuration(run.created_at, run.completed_at)}
          </span>
        <div className="flex gap-2 ml-auto">
          <Badge variant={runStatusBadgeVariant(statusLabel)}>{statusLabel}</Badge>
          <Badge variant="outline">{run.trigger}</Badge>
          <ChevronDownIcon
            className={cn(
              'size-4 shrink-0 text-muted-foreground transition-transform',
              open && 'rotate-180'
            )}
          />
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t px-2 py-2">
        {run.workflow_step_runs.length === 0 ? (
          <p className="px-2 py-1 text-muted-foreground text-xs">No step records</p>
        ) : (
          <div className="space-y-1">
            {run.workflow_step_runs.map((step) => (
              <StepRunRow key={step.id} step={step} />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

function AuditRunList({ runs }: { runs: WorkflowRunRow[] }) {
  const [openRunIds, setOpenRunIds] = useState<Set<string>>(() => new Set())
  const dayGroups = useMemo(() => groupRunsByDay(runs), [runs])

  const toggleRun = (runId: string, open: boolean) => {
    setOpenRunIds((prev) => {
      const next = new Set(prev)
      if (open) next.add(runId)
      else next.delete(runId)
      return next
    })
  }

  return (
    <div className="space-y-6 px-4 py-4">
      {dayGroups.map(([day, dayRuns]) => (
        <section key={day}>
          <p className="mb-3 text-muted-foreground text-xs font-medium uppercase tracking-wide">
            {day}
          </p>
          <div className="space-y-2">
            {dayRuns.map((run) => (
              <RunRow
                key={run.id}
                run={run}
                open={openRunIds.has(run.id)}
                onOpenChange={(open) => toggleRun(run.id, open)}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export function WorkflowAuditPanel({ workflowKey, running }: WorkflowAuditPanelProps) {
  const { runs, totalCount, loading, fetchError, page, changePage } = useAuditLogs({
    workflowKey,
    running,
  })
  const totalPages = Math.max(1, Math.ceil(totalCount / AUDIT_LOGS_PAGE_SIZE))

  return (
    <div className="flex h-full flex-col">

      <div className="flex flex-1 flex-col overflow-y-auto">
        {loading ? (
          <div className="space-y-3 px-4 py-4">
            <RunRowSkeleton />
            <RunRowSkeleton />
            <RunRowSkeleton />
          </div>
        ) : fetchError ? (
          <p className="px-4 py-8 text-center text-destructive text-sm">{fetchError}</p>
        ) : runs.length === 0 ? (
          <p className="py-8 text-center text-muted-foreground text-sm">
            No runs recorded yet
          </p>
        ) : (
          <AuditRunList key={page} runs={runs} />
        )}
      </div>

      {!loading && !fetchError && totalCount > 0 ? (
        <div className="flex shrink-0 items-center justify-between border-t px-4 py-3">
          <p className="text-muted-foreground text-xs">
            Page {page + 1} of {totalPages} · {totalCount} entries
          </p>
          {totalPages > 1 ? (
            <Pagination className="mx-0 w-auto">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      if (page > 0) changePage(page - 1)
                    }}
                    className={page === 0 ? 'pointer-events-none opacity-50' : undefined}
                    tabIndex={page === 0 ? -1 : undefined}
                    aria-disabled={page === 0}
                  />
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(event) => {
                      event.preventDefault()
                      if (page < totalPages - 1) changePage(page + 1)
                    }}
                    className={
                      page >= totalPages - 1 ? 'pointer-events-none opacity-50' : undefined
                    }
                    tabIndex={page >= totalPages - 1 ? -1 : undefined}
                    aria-disabled={page >= totalPages - 1}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
