"use client"

import { DownloadIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useState } from "react"
import { toast } from "sonner"

import { DepartmentChip } from "@/components/department-chip"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  USAGE_LOG_STATUS_BADGE_CLASSES,
  type BrandColorKey,
  buildDepartmentColorMap,
  departmentBadgeClass,
} from "@/lib/brand-colors"
import type { SystemLogsFilterParams } from "@/lib/date-range-filter"
import { buildSystemLogsHref } from "@/lib/date-range-filter"
import { cn } from "@/lib/utils"

export type SystemLogRow = {
  id: string
  resource_key: string | null
  resource_type: string
  run_id: string | null
  step_id: string | null
  tokens_in: number | null
  tokens_out: number | null
  duration_ms: number | null
  status: string
  created_at: string
  department_id: string | null
}

type Department = {
  id: string
  name: string
  color?: string | null
}

type SelectionMode = "none" | "partial" | "all-filtered"

type StoredSelection = {
  mode: SelectionMode
  ids: string[]
}

type SystemLogsTableProps = {
  rows: SystemLogRow[]
  departments: Department[]
  totalCount: number
  filters: SystemLogsFilterParams
}

function filtersStorageKey(filters: SystemLogsFilterParams): string {
  return [
    filters.search ?? "",
    filters.status ?? "",
    filters.type ?? "",
    filters.team ?? "",
    filters.from ?? "",
    filters.to ?? "",
    filters.tz ?? "",
  ].join("|")
}

function readStoredSelection(key: string): StoredSelection {
  if (typeof window === "undefined") {
    return { mode: "none", ids: [] }
  }

  try {
    const raw = sessionStorage.getItem(`system-logs-selection:${key}`)
    if (!raw) return { mode: "none", ids: [] }

    const parsed = JSON.parse(raw) as StoredSelection
    if (
      parsed.mode !== "none" &&
      parsed.mode !== "partial" &&
      parsed.mode !== "all-filtered"
    ) {
      return { mode: "none", ids: [] }
    }

    return {
      mode: parsed.mode,
      ids: Array.isArray(parsed.ids) ? parsed.ids : [],
    }
  } catch {
    return { mode: "none", ids: [] }
  }
}

function writeStoredSelection(key: string, value: StoredSelection) {
  if (typeof window === "undefined") return

  if (value.mode === "none") {
    sessionStorage.removeItem(`system-logs-selection:${key}`)
    return
  }

  sessionStorage.setItem(`system-logs-selection:${key}`, JSON.stringify(value))
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString()
}

function teamCell(
  row: SystemLogRow,
  departmentNames: Map<string, string>,
  colorMap: Map<string, BrandColorKey>,
) {
  const isWorkflowType =
    row.resource_type === "workflow" || row.resource_type === "workflow_step"

  if (!isWorkflowType || !row.department_id) {
    return <span className="text-muted-foreground">—</span>
  }

  const name = departmentNames.get(row.department_id)
  if (!name) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <Badge
      className={cn(
        departmentBadgeClass(row.department_id, colorMap),
        "rounded-full",
      )}
    >
      {name}
    </Badge>
  )
}

function statusBadge(status: string) {
  const className =
    status === "success" || status === "error"
      ? USAGE_LOG_STATUS_BADGE_CLASSES[status]
      : undefined

  return (
    <Badge className={className} variant={className ? undefined : "outline"}>
      {status}
    </Badge>
  )
}

function parseContentDispositionFilename(header: string | null): string | null {
  if (!header) return null

  const match = header.match(/filename="([^"]+)"/)
  return match?.[1] ?? null
}

export function SystemLogsTable({
  rows,
  departments,
  totalCount,
  filters,
}: SystemLogsTableProps) {
  const router = useRouter()
  const storageKey = useMemo(() => filtersStorageKey(filters), [filters])

  const departmentNames = useMemo(
    () => new Map(departments.map((department) => [department.id, department.name])),
    [departments],
  )
  const colorMap = useMemo(
    () => buildDepartmentColorMap(departments),
    [departments],
  )

  const [selectionMode, setSelectionMode] = useState<SelectionMode>("none")
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [exportingFormat, setExportingFormat] = useState<"json" | "csv" | null>(
    null,
  )

  useEffect(() => {
    const stored = readStoredSelection(storageKey)
    setSelectionMode(stored.mode)
    setSelectedIds(new Set(stored.ids))
  }, [storageKey])

  const persistSelection = useCallback(
    (mode: SelectionMode, ids: Set<string>) => {
      writeStoredSelection(storageKey, {
        mode,
        ids: Array.from(ids),
      })
    },
    [storageKey],
  )

  const pageRowIds = useMemo(() => rows.map((row) => row.id), [rows])

  const isRowSelected = useCallback(
    (id: string) => selectionMode === "all-filtered" || selectedIds.has(id),
    [selectedIds, selectionMode],
  )

  const allPageSelected =
    pageRowIds.length > 0 && pageRowIds.every((id) => isRowSelected(id))
  const somePageSelected =
    pageRowIds.some((id) => isRowSelected(id)) && !allPageSelected

  const effectiveMode: SelectionMode =
    selectionMode === "partial" && selectedIds.size === 0
      ? "none"
      : selectionMode

  const updateSelection = (mode: SelectionMode, ids: Set<string>) => {
    setSelectionMode(mode)
    setSelectedIds(ids)
    persistSelection(mode, ids)
  }

  const toggleRow = (id: string, checked: boolean) => {
    if (selectionMode === "all-filtered") {
      if (!checked) {
        const next = new Set(pageRowIds.filter((rowId) => rowId !== id))
        updateSelection(next.size > 0 ? "partial" : "none", next)
      }
      return
    }

    const next = new Set(selectedIds)
    if (checked) next.add(id)
    else next.delete(id)

    updateSelection(next.size > 0 ? "partial" : "none", next)
  }

  const toggleAllPage = (checked: boolean) => {
    if (selectionMode === "all-filtered") {
      if (!checked) {
        updateSelection("none", new Set())
      }
      return
    }

    const next = new Set(selectedIds)
    for (const id of pageRowIds) {
      if (checked) next.add(id)
      else next.delete(id)
    }

    updateSelection(next.size > 0 ? "partial" : "none", next)
  }

  const handleTeamToggle = (departmentId: string) => {
    const nextTeam = filters.team === departmentId ? undefined : departmentId
    router.push(buildSystemLogsHref(filters, { team: nextTeam, page: undefined }))
  }

  const handleExport = async (format: "json" | "csv") => {
    if (effectiveMode === "none") return

    setExportingFormat(format)

    try {
      const body =
        effectiveMode === "all-filtered"
          ? {
              format,
              filters: {
                search: filters.search,
                status: filters.status,
                type: filters.type,
                team: filters.team,
                from: filters.from,
                to: filters.to,
                tz: filters.tz,
              },
            }
          : {
              format,
              ids: Array.from(selectedIds),
            }

      const response = await fetch("/api/analytics/system-logs/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as {
          error?: string
        } | null
        toast.error(payload?.error ?? "Export failed")
        return
      }

      const blob = await response.blob()
      const filename =
        parseContentDispositionFilename(
          response.headers.get("Content-Disposition"),
        ) ?? `system-logs.${format}`

      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = filename
      anchor.click()
      URL.revokeObjectURL(url)
    } catch {
      toast.error("Export failed")
    } finally {
      setExportingFormat(null)
    }
  }

  const toolbar = (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      {departments.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {departments.map((department) => (
            <DepartmentChip
              key={department.id}
              name={department.name}
              colorKey={colorMap.get(department.id) ?? "emerald"}
              selected={filters.team === department.id}
              onClick={() => handleTeamToggle(department.id)}
            />
          ))}
        </div>
      ) : null}
      <div className="ml-auto flex flex-wrap items-center gap-3">
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={effectiveMode === "none" || exportingFormat !== null}
            onClick={() => void handleExport("csv")}
          >
            <DownloadIcon />
            Export CSV
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={effectiveMode === "none" || exportingFormat !== null}
            onClick={() => void handleExport("json")}
          >
            <DownloadIcon />
            Export JSON
          </Button>
        </div>
      </div>
    </div>
  )

  if (!rows.length) {
    return (
      <div className="flex flex-col gap-3">
        {toolbar}
        <p className="py-8 text-center text-sm text-muted-foreground">
          No log entries match your filters
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {toolbar}

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full font-mono text-xs">
          <thead className="border-b bg-muted/50">
            <tr>
              <th className="w-10 px-4 py-2">
                <Checkbox
                  checked={
                    effectiveMode === "all-filtered" || allPageSelected
                      ? true
                      : somePageSelected
                        ? "indeterminate"
                        : false
                  }
                  onCheckedChange={(value) => toggleAllPage(value === true)}
                  aria-label="Select all rows on this page"
                />
              </th>
              {[
                "Time",
                "Resource",
                "Type",
                "Team",
                "Run ID",
                "Step",
                "In",
                "Out",
                "Duration",
                "Status",
              ].map((header) => (
                <th
                  key={header}
                  className="px-4 py-2 text-left font-medium text-muted-foreground"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="border-b last:border-0">
                <td className="px-4 py-1.5">
                  <Checkbox
                    checked={isRowSelected(row.id)}
                    onCheckedChange={(value) =>
                      toggleRow(row.id, value === true)
                    }
                    aria-label={`Select log ${row.resource_key}`}
                  />
                </td>
                <td className="px-4 py-1.5 text-muted-foreground">
                  {formatTimestamp(row.created_at)}
                </td>
                <td className="px-4 py-1.5">{row.resource_key ?? "—"}</td>
                <td className="px-4 py-1.5">{row.resource_type}</td>
                <td className="px-4 py-1.5">
                  {teamCell(row, departmentNames, colorMap)}
                </td>
                <td className="px-4 py-1.5 text-muted-foreground">
                  {row.run_id ? row.run_id.slice(0, 8) : "—"}
                </td>
                <td className="px-4 py-1.5 text-muted-foreground">
                  {row.step_id ?? "—"}
                </td>
                <td className="px-4 py-1.5 tabular-nums">
                  {row.tokens_in ?? 0}
                </td>
                <td className="px-4 py-1.5 tabular-nums">
                  {row.tokens_out ?? 0}
                </td>
                <td className="px-4 py-1.5 tabular-nums">
                  {row.duration_ms != null ? `${row.duration_ms}ms` : "—"}
                </td>
                <td className="px-4 py-1.5">{statusBadge(row.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
