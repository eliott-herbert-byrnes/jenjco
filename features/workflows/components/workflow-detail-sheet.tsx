'use client'

import { Fragment, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { NetworkIcon } from 'lucide-react'

import { paths } from '@/app/paths'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { FlagWorkflowDialog } from '@/features/workflows/components/flag-workflow-dialog'
import { WorkflowRunChart } from '@/features/workflows/components/workflow-run-chart'
import { WorkflowStatCards } from '@/features/workflows/components/workflow-stat-cards'
import { useWorkflowDetailStats } from '@/features/workflows/hooks/use-workflow-detail-stats'
import { extractMarkdownSection } from '@/features/workflows/lib/extract-markdown-section'
import type { WorkflowHubRow } from '@/features/workflows/types'
import { createClient } from '@/lib/supabase/client'

type ProcessConnection = {
  provider: string
  sort_order: number
}

type LinkedProcess = {
  id: string
  title: string
  content: string | null
  process_connections: ProcessConnection[] | null
}

type ProcessWorkflowRow = {
  sort_order: number
  org_processes: LinkedProcess | LinkedProcess[] | null
}

type WorkflowDetailSheetProps = {
  workflow: WorkflowHubRow | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

function normalizeProcess(
  value: ProcessWorkflowRow['org_processes']
): LinkedProcess | null {
  if (!value) return null
  return Array.isArray(value) ? (value[0] ?? null) : value
}

export function WorkflowDetailSheet({
  workflow,
  open,
  onOpenChange,
}: WorkflowDetailSheetProps) {
  const router = useRouter()
  const workflowId = workflow?.id
  const workflowKey = workflow?.workflow_key
  const [processes, setProcesses] = useState<LinkedProcess[]>([])
  const [processesLoading, setProcessesLoading] = useState(false)
  const [prevWorkflowId, setPrevWorkflowId] = useState<string | undefined>(
    workflowId
  )

  const {
    stats,
    dailyRuns,
    loading: statsLoading,
  } = useWorkflowDetailStats({
    workflowKey,
    enabled: open && !!workflowKey,
  })

  if (workflowId !== prevWorkflowId) {
    setPrevWorkflowId(workflowId)
    setProcesses([])
    setProcessesLoading(false)
  }

  useEffect(() => {
    if (!open || !workflowId) return

    const activeWorkflowId = workflowId
    let cancelled = false

    async function load() {
      setProcessesLoading(true)

      const supabase = createClient()
      const { data, error } = await supabase
        .from('process_workflows')
        .select(
          `
          sort_order,
          org_processes (
            id, title, content,
            process_connections ( provider, sort_order )
          )
        `
        )
        .eq('workflow_id', activeWorkflowId)
        .order('sort_order')

      if (cancelled) return

      if (error) {
        setProcesses([])
        setProcessesLoading(false)
        return
      }

      const linked = (data as ProcessWorkflowRow[] | null)
        ?.map((row) => normalizeProcess(row.org_processes))
        .filter((process): process is LinkedProcess => process !== null)

      setProcesses(linked ?? [])
      setProcessesLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [open, workflowId])

  const loading = processesLoading || statsLoading

  const overview = useMemo(() => {
    const fromContent = extractMarkdownSection(
      processes[0]?.content,
      'Overview'
    )
    return fromContent ?? workflow?.description ?? ''
  }, [processes, workflow?.description])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[480px] rounded-3xl p-2">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            {workflow?.display_name ?? 'Workflow'}
          </SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-6 overflow-y-auto px-6 pb-8">
          {loading ? (
            <p className="text-xs text-muted-foreground">
              Loading workflow details…
            </p>
          ) : (
            <>
              <section className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Overview
                </p>
                <p className="line-clamp-6 text-sm text-muted-foreground">
                  {overview || 'No overview available.'}
                </p>
              </section>
              <Separator />

              <section className="flex flex-col gap-3">
                <WorkflowStatCards stats={stats} />
              </section>
              <Separator />

              <section className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Daily Run Count
                </p>
                <WorkflowRunChart dailyRuns={dailyRuns} />
              </section>
              <Separator />

              <section className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Processes
                </p>
                {processes.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No processes</p>
                ) : (
                  processes.map((process) => (
                    <Fragment key={process.id}>
                      <Link
                        href={paths.processDetail(process.id)}
                        className="flex items-center gap-2 rounded-sm bg-gray-400/10 p-2 text-sm hover:bg-gray-400/20"
                        onClick={() => onOpenChange(false)}
                      >
                        <NetworkIcon className="ml-1 mr-1 size-4 shrink-0 text-muted-foreground" />
                        {process.title}
                      </Link>
                    </Fragment>
                  ))
                )}
              </section>
            </>
          )}
        </div>

        <SheetFooter className="flex-col justify-between border-t sm:justify-between">
          <Button
            type="button"
            variant="brand-emerald"
            disabled={!workflow}
            onClick={() => {
              if (!workflow) return
              onOpenChange(false)
              router.push(`${paths.workflows}/${workflow.id}`)
            }}
          >
            Run
          </Button>
          <FlagWorkflowDialog
            trigger={
              <Button type="button" variant="destructive">
                Flag
              </Button>
            }
          />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
