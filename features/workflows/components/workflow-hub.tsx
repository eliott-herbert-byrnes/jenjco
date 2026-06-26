'use client'

import { useMemo, useState } from 'react'
import { MoreVerticalIcon, SearchIcon } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { FlagWorkflowDialog } from '@/features/workflows/components/flag-workflow-dialog'
import { RequestWorkflowDialog } from '@/features/workflows/components/request-workflow-dialog'
import { WorkflowDetailSheet } from '@/features/workflows/components/workflow-detail-sheet'
import type { WorkflowHubRow } from '@/features/workflows/types'
import {
  BRAND_BADGE_CLASSES,
  type BrandColorKey,
  buildDepartmentColorMap,
} from '@/lib/brand-colors'
import { cn } from '@/lib/utils'

type WorkflowHubProps = {
  workflows: WorkflowHubRow[]
  departments: { id: string; name: string }[]
}

type SortBy = 'name' | 'status' | 'last_executed' | 'run_count'

const STATUS_SORT_ORDER: Record<string, number> = {
  active: 0,
  flagged: 1,
  inactive: 2,
}

const BRAND_FILTER_SELECTED_CLASSES: Record<BrandColorKey, string> = {
  orange: 'border-brand-orange bg-brand-orange/30 text-brand-orange',
  violet:
    'border-brand-violet bg-brand-violet/30 text-violet-900 dark:text-brand-violet',
  amber: 'border-brand-amber bg-brand-amber/30 text-amber-900',
  sky: 'border-brand-sky bg-brand-sky/30 text-brand-sky',
  emerald: 'border-brand-emerald bg-brand-emerald/30 text-brand-emerald',
}

function departmentBadge(
  departmentId: string | null,
  departmentName: string | null,
  colorMap: Map<string, BrandColorKey>
) {
  if (!departmentName) {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  const colorKey =
    (departmentId ? colorMap.get(departmentId) : undefined) ?? 'emerald'

  return (
    <Badge className={cn(BRAND_BADGE_CLASSES[colorKey], 'rounded-full')}>
      {departmentName}
    </Badge>
  )
}

function formatLastExecuted(iso: string | null): string {
  if (!iso) return '—'

  try {
    const date = new Date(iso)
    const day = String(date.getDate()).padStart(2, '0')
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${day}.${month}.${year} - ${hours}:${minutes}`
  } catch {
    return '—'
  }
}

function statusBadge(status: string) {
  if (status === 'active') {
    return (
      <Badge variant="secondary" className="rounded-full">
        Active
      </Badge>
    )
  }

  if (status === 'flagged') {
    return (
      <Badge variant="outline" className="rounded-full">
        Flagged
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="rounded-full text-muted-foreground">
      Inactive
    </Badge>
  )
}

export function WorkflowHub({ workflows, departments }: WorkflowHubProps) {
  const departmentColorMap = buildDepartmentColorMap(departments)
  const [search, setSearch] = useState('')
  const [teamFilter, setTeamFilter] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<SortBy>('name')
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowHubRow | null>(
    null
  )
  const [sheetOpen, setSheetOpen] = useState(false)
  const [flagDialogOpen, setFlagDialogOpen] = useState(false)

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    let rows = workflows.filter((workflow) => {
      if (query && !workflow.display_name.toLowerCase().includes(query)) {
        return false
      }

      if (teamFilter && workflow.department_id !== teamFilter) {
        return false
      }

      return true
    })

    rows = [...rows].sort((a, b) => {
      if (sortBy === 'run_count') {
        return b.run_count - a.run_count
      }

      if (sortBy === 'last_executed') {
        const aTime = a.last_executed ? new Date(a.last_executed).getTime() : 0
        const bTime = b.last_executed ? new Date(b.last_executed).getTime() : 0
        return bTime - aTime
      }

      if (sortBy === 'status') {
        const aOrder = STATUS_SORT_ORDER[a.status] ?? Number.MAX_SAFE_INTEGER
        const bOrder = STATUS_SORT_ORDER[b.status] ?? Number.MAX_SAFE_INTEGER
        if (aOrder !== bOrder) {
          return aOrder - bOrder
        }
        return a.display_name.localeCompare(b.display_name)
      }

      return a.display_name.localeCompare(b.display_name)
    })

    return rows
  }, [workflows, search, teamFilter, sortBy])

  function openWorkflowSheet(workflow: WorkflowHubRow) {
    setSelectedWorkflow(workflow)
    setSheetOpen(true)
  }

  function handleSheetOpenChange(open: boolean) {
    setSheetOpen(open)
    if (!open) {
      setSelectedWorkflow(null)
    }
  }

  return (
    <>
      <div className="mx-auto flex w-full flex-col gap-6 px-6 py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-xl">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search workflows..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>
          <RequestWorkflowDialog teams={departments} />
        </div>

        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {departments.map((department) => {
              const colorKey =
                departmentColorMap.get(department.id) ?? 'emerald'

              return (
                <Button
                  key={department.id}
                  type="button"
                  variant="outline"
                  size="sm"
                  className={cn(
                    `rounded-full ${BRAND_FILTER_SELECTED_CLASSES[colorKey]}`
                  )}
                  onClick={() =>
                    setTeamFilter((current) =>
                      current === department.id ? null : department.id
                    )
                  }
                >
                  {department.name}
                </Button>
              )
            })}
          </div>

          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortBy)}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Sort by..." />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="name">Sort by name</SelectItem>
              <SelectItem value="status">Sort by status</SelectItem>
              <SelectItem value="last_executed">Sort by last executed</SelectItem>
              <SelectItem value="run_count">Sort by run count</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <div className="hidden px-4 text-xs font-medium text-muted-foreground sm:grid sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.7fr)_2.5rem] sm:gap-4">
            <span>Name</span>
            <span>Team</span>
            <span>Status</span>
            <span>Last Executed</span>
            <span>Run Count</span>
            <span className="sr-only">Actions</span>
          </div>

          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              No workflows match your filters.
            </p>
          ) : (
            filtered.map((workflow) => (
              <div
                key={workflow.id}
                role="button"
                tabIndex={0}
                className={cn(
                  'grid cursor-pointer gap-3 rounded-xl border px-4 py-3 transition-colors hover:bg-muted/30 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)_minmax(0,0.7fr)_2.5rem] sm:items-center sm:gap-4',
                  selectedWorkflow?.id === workflow.id && sheetOpen && 'bg-muted/40'
                )}
                onClick={() => openWorkflowSheet(workflow)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    openWorkflowSheet(workflow)
                  }
                }}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{workflow.display_name}</p>
                  <div className="sm:hidden">
                    {departmentBadge(
                      workflow.department_id,
                      workflow.department_name,
                      departmentColorMap
                    )}
                  </div>
                </div>
                <div className="hidden sm:block">
                  {departmentBadge(
                    workflow.department_id,
                    workflow.department_name,
                    departmentColorMap
                  )}
                </div>
                <div>{statusBadge(workflow.status)}</div>
                <p className="text-sm text-muted-foreground">
                  {formatLastExecuted(workflow.last_executed)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {workflow.run_count.toLocaleString()}
                </p>
                <div
                  className="flex justify-end"
                  data-workflow-actions=""
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => event.stopPropagation()}
                  onKeyDown={(event) => event.stopPropagation()}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button type="button" variant="ghost" size="icon-sm">
                        <MoreVerticalIcon className="size-4" />
                        <span className="sr-only">
                          Actions for {workflow.display_name}
                        </span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onSelect={() => setFlagDialogOpen(true)}
                        onPointerDown={(event) => event.preventDefault()}
                      >
                        Flag
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <WorkflowDetailSheet
        workflow={selectedWorkflow}
        open={sheetOpen}
        onOpenChange={handleSheetOpenChange}
      />

      <FlagWorkflowDialog
        open={flagDialogOpen}
        onOpenChange={setFlagDialogOpen}
      />
    </>
  )
}
