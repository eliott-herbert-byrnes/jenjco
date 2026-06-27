"use client"

import { ChevronDownIcon, SearchIcon } from "lucide-react"
import { useMemo, useState } from "react"

import { DepartmentChip } from "@/components/department-chip"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useWorkflowStepStats } from "@/features/analytics/hooks/use-workflow-step-stats"
import type {
  WorkflowStepStatsRow,
  WorkflowSummaryRow,
} from "@/features/analytics/types"
import {
  StepKindBadge,
  StepStatusBadge,
} from "@/features/workflows/components/step-badges"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import {
  BRAND_BADGE_CLASSES,
  type BrandColorKey,
  buildDepartmentColorMap,
} from "@/lib/brand-colors"
import { cn } from "@/lib/utils"

type StatusFilter = "all" | "has_failures"

const WORKFLOW_SUMMARY_GRID_COLS =
  "grid-cols-[minmax(0,1fr)_6rem_5rem_5rem_minmax(0,9rem)_5rem_1.25rem]"

function formatDuration(ms: number | null): string {
  if (ms == null) return "—"
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms)}ms`
}

function formatLastRun(at: string | null): string {
  if (!at) return "—"
  return new Date(at).toLocaleString()
}

function fixSuggestion(reason: string, description: string): string {
  const text = `${reason} ${description}`.toLowerCase()
  if (text.includes("timeout")) return "Retry the workflow"
  if (text.includes("auth") || text.includes("permission")) return "Contact support"
  return "Restart or contact support"
}

function departmentBadge(
  departmentId: string | null,
  departmentName: string | null,
  colorMap: Map<string, BrandColorKey>,
) {
  if (!departmentName) {
    return <span className="text-sm text-muted-foreground">—</span>
  }

  const colorKey =
    (departmentId ? colorMap.get(departmentId) : undefined) ?? "emerald"

  return (
    <Badge className={cn(BRAND_BADGE_CLASSES[colorKey], "rounded-full")}>
      {departmentName}
    </Badge>
  )
}

function StepStatsRow({ step }: { step: WorkflowStepStatsRow }) {
  const failed = step.latest_status === "failed"
  const error = step.latest_error

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted"
        >
          <span className="min-w-0 flex-1">
            <span className="block font-mono">{step.step_id}</span>
            <span className="text-muted-foreground">
              {step.total_executions.toLocaleString()} runs ·{" "}
              {step.failed_executions.toLocaleString()} failures
            </span>
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <StepKindBadge kind={step.kind} />
            <StepStatusBadge status={step.latest_status} />
          </div>
        </button>
      </PopoverTrigger>
      <PopoverContent side="bottom" align="start" className="w-72">
        <PopoverHeader>
          <PopoverTitle>{step.step_id}</PopoverTitle>
          <PopoverDescription>
            Latest status: {step.latest_status}
          </PopoverDescription>
        </PopoverHeader>
        <div className="space-y-2 text-xs">
          <div>
            <p className="font-medium text-foreground">Executions</p>
            <p className="text-muted-foreground">
              {step.total_executions.toLocaleString()} total ·{" "}
              {step.failed_executions.toLocaleString()} failed
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground">Last executed</p>
            <p className="text-muted-foreground">
              {new Date(step.last_executed_at).toLocaleString()}
            </p>
          </div>
          {failed && error ? (
            <>
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
            </>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function StepStatsSkeleton() {
  return (
    <div className="space-y-2 px-2 py-1">
      <div className="h-8 rounded bg-muted animate-pulse" />
      <div className="h-8 rounded bg-muted animate-pulse" />
    </div>
  )
}

function WorkflowSummaryRow({
  row,
  open,
  onOpenChange,
  departmentColorMap,
}: {
  row: WorkflowSummaryRow
  open: boolean
  onOpenChange: (open: boolean) => void
  departmentColorMap: Map<string, BrandColorKey>
}) {
  const { steps, loading, fetchError } = useWorkflowStepStats(
    row.workflow_key,
    open
  )

  return (
    <Collapsible
      open={open}
      onOpenChange={onOpenChange}
      className="rounded-lg border"
    >
      <CollapsibleTrigger
        className={cn(
          "flex w-full items-center justify-between gap-2 px-3 py-3 text-left text-sm",
          "sm:grid sm:items-center sm:gap-x-4",
          WORKFLOW_SUMMARY_GRID_COLS
        )}
      >
        <span className="font-medium max-sm:min-w-0 max-sm:flex-1 max-sm:truncate">
          {row.display_name}
        </span>
        <span className="max-sm:hidden">
          {departmentBadge(
            row.department_id,
            row.department_name,
            departmentColorMap,
          )}
        </span>
        <span className="tabular-nums max-sm:hidden">
          {row.total_runs.toLocaleString()}
        </span>
        <span className="tabular-nums max-sm:hidden">
          {row.failed_runs.toLocaleString()}
        </span>
        <span className="truncate text-muted-foreground max-sm:hidden">
          {formatLastRun(row.last_run_at)}
        </span>
        <span className="tabular-nums max-sm:hidden">
          {formatDuration(row.avg_duration_ms)}
        </span>
        <ChevronDownIcon
          className={cn(
            "size-4 shrink-0 justify-self-end text-muted-foreground transition-transform",
            open && "rotate-180"
          )}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t px-2 py-2">
        {loading ? (
          <StepStatsSkeleton />
        ) : fetchError ? (
          <p className="px-2 py-1 text-destructive text-xs">{fetchError}</p>
        ) : steps.length === 0 ? (
          <p className="px-2 py-1 text-muted-foreground text-xs">
            No step records
          </p>
        ) : (
          <div className="space-y-1">
            {steps.map((step) => (
              <StepStatsRow key={step.step_id} step={step} />
            ))}
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

function WorkflowSummaryList({
  rows,
  departmentColorMap,
}: {
  rows: WorkflowSummaryRow[]
  departmentColorMap: Map<string, BrandColorKey>
}) {
  const [openWorkflowKeys, setOpenWorkflowKeys] = useState<Set<string>>(
    () => new Set()
  )

  const toggleWorkflow = (workflowKey: string, open: boolean) => {
    setOpenWorkflowKeys((prev) => {
      const next = new Set(prev)
      if (open) next.add(workflowKey)
      else next.delete(workflowKey)
      return next
    })
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "hidden w-full items-center gap-x-4 px-3 sm:grid",
          WORKFLOW_SUMMARY_GRID_COLS,
          "text-muted-foreground text-xs font-medium"
        )}
      >
        <span>Name</span>
        <span>Team</span>
        <span>Total Runs</span>
        <span>Failures</span>
        <span>Last Run</span>
        <span>Avg Duration</span>
        <span className="sr-only">Expand</span>
      </div>
      {rows.map((row) => (
        <WorkflowSummaryRow
          key={row.workflow_key}
          row={row}
          open={openWorkflowKeys.has(row.workflow_key)}
          onOpenChange={(open) => toggleWorkflow(row.workflow_key, open)}
          departmentColorMap={departmentColorMap}
        />
      ))}
    </div>
  )
}

export function WorkflowSummaryTable({
  rows,
  departments,
}: {
  rows: WorkflowSummaryRow[]
  departments: { id: string; name: string; color?: string | null }[]
}) {
  const [search, setSearch] = useState("")
  const debouncedSearch = useDebouncedValue(search)
  const [teamFilter, setTeamFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")

  const departmentColorMap = useMemo(
    () => buildDepartmentColorMap(departments),
    [departments],
  )

  const filtered = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase()

    return rows.filter((row) => {
      if (query && !row.display_name.toLowerCase().includes(query)) {
        return false
      }

      if (teamFilter && row.department_id !== teamFilter) {
        return false
      }

      if (statusFilter === "has_failures" && row.failed_runs === 0) {
        return false
      }

      return true
    })
  }, [rows, debouncedSearch, teamFilter, statusFilter])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Workflow Summary</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="relative max-w-xl flex-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search workflows..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pl-9"
            />
          </div>

          <Select
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="all">All workflows</SelectItem>
              <SelectItem value="has_failures">Has failures</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {departments.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {departments.map((department) => (
              <DepartmentChip
                key={department.id}
                name={department.name}
                colorKey={departmentColorMap.get(department.id) ?? "emerald"}
                selected={teamFilter === department.id}
                onClick={() =>
                  setTeamFilter((current) =>
                    current === department.id ? null : department.id
                  )
                }
              />
            ))}
          </div>
        ) : null}

        {!filtered.length ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No workflows match your filters.
          </p>
        ) : (
          <WorkflowSummaryList
            rows={filtered}
            departmentColorMap={departmentColorMap}
          />
        )}
      </CardContent>
    </Card>
  )
}
