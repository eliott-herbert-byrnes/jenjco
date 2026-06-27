"use client"

import { CalendarIcon, SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import type { DateRange } from "react-day-picker"

import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import {
  buildSystemLogsHref,
  getBrowserTimeZone,
  type SystemLogsFilterParams,
} from "@/lib/date-range-filter"
import { cn } from "@/lib/utils"

const ALL = "__all__"

type SystemLogsFiltersProps = SystemLogsFilterParams

function parseDateParam(value?: string): Date | undefined {
  if (!value) return undefined

  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined

  return new Date(year, month - 1, day)
}

function formatDateParam(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")

  return `${year}-${month}-${day}`
}

function dateRangeLabel(from?: string, to?: string): string {
  if (from && to) return `${from} – ${to}`
  if (from) return `${from} – …`
  return "Date range"
}

export function SystemLogsFilters({
  search: initialSearch,
  status: initialStatus,
  type: initialType,
  team,
  from: initialFrom,
  to: initialTo,
}: SystemLogsFiltersProps) {
  const router = useRouter()
  const skipSearchPush = useRef(true)

  const [search, setSearch] = useState(initialSearch ?? "")
  const [status, setStatus] = useState(initialStatus || ALL)
  const [resourceType, setResourceType] = useState(initialType || ALL)
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => ({
    from: parseDateParam(initialFrom),
    to: parseDateParam(initialTo),
  }))

  const debouncedSearch = useDebouncedValue(search)

  const navigate = (next: {
    search?: string
    status?: string
    type?: string
    team?: string | null
    from?: string
    to?: string
    tz?: string
  } = {}) => {
    const resolvedSearch = next.search ?? debouncedSearch
    const resolvedStatus = next.status ?? status
    const resolvedType = next.type ?? resourceType
    const resolvedTeam = next.team !== undefined ? next.team : (team ?? null)
    const resolvedFrom =
      "from" in next
        ? next.from
        : dateRange?.from
          ? formatDateParam(dateRange.from)
          : undefined
    const resolvedTo =
      "to" in next
        ? next.to
        : dateRange?.to
          ? formatDateParam(dateRange.to)
          : undefined
    const resolvedTz =
      "tz" in next
        ? next.tz
        : resolvedFrom && resolvedTo
          ? getBrowserTimeZone()
          : undefined

    const href = buildSystemLogsHref({
      search: resolvedSearch.trim() || undefined,
      status: resolvedStatus !== ALL ? resolvedStatus : undefined,
      type: resolvedType !== ALL ? resolvedType : undefined,
      team: resolvedTeam ?? undefined,
      from: resolvedFrom,
      to: resolvedTo,
      tz: resolvedTz,
    })

    router.push(href)
  }

  useEffect(() => {
    if (skipSearchPush.current) {
      skipSearchPush.current = false
      return
    }

    navigate({ search: debouncedSearch })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- push when debounced search changes only
  }, [debouncedSearch])

  const handleStatusChange = (value: string) => {
    setStatus(value)
    navigate({ status: value })
  }

  const handleTypeChange = (value: string) => {
    setResourceType(value)
    navigate({ type: value })
  }

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range)

    if (range?.from && range?.to) {
      navigate({
        from: formatDateParam(range.from),
        to: formatDateParam(range.to),
      })
    }
  }

  const clearDateRange = () => {
    setDateRange(undefined)
    navigate({ from: undefined, to: undefined, tz: undefined })
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
        <Field className="min-w-[200px] flex-1">
          <FieldLabel htmlFor="logs-search">Resource key</FieldLabel>
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="logs-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Filter by resource key..."
              className="pl-9"
            />
          </div>
        </Field>

        <Field className="min-w-[140px] sm:w-[160px]">
          <FieldLabel htmlFor="logs-status">Status</FieldLabel>
          <Select value={status} onValueChange={handleStatusChange}>
            <SelectTrigger id="logs-status" className="w-full">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value={ALL}>All statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field className="min-w-[160px] sm:w-[180px]">
          <FieldLabel htmlFor="logs-type">Type</FieldLabel>
          <Select value={resourceType} onValueChange={handleTypeChange}>
            <SelectTrigger id="logs-type" className="w-full">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value={ALL}>All types</SelectItem>
              <SelectItem value="agent">Agent</SelectItem>
              <SelectItem value="workflow">Workflow</SelectItem>
              <SelectItem value="workflow_step">Workflow step</SelectItem>
            </SelectContent>
          </Select>
        </Field>

        <Field className="min-w-[200px] sm:w-[240px]">
          <FieldLabel>Date range</FieldLabel>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateRange?.from && "text-muted-foreground",
                )}
              >
                <CalendarIcon className="size-4" />
                {dateRangeLabel(
                  dateRange?.from ? formatDateParam(dateRange.from) : undefined,
                  dateRange?.to ? formatDateParam(dateRange.to) : undefined,
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={handleDateRangeSelect}
                numberOfMonths={2}
              />
              {dateRange?.from ? (
                <div className="border-t p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full"
                    onClick={clearDateRange}
                  >
                    Clear dates
                  </Button>
                </div>
              ) : null}
            </PopoverContent>
          </Popover>
        </Field>
    </div>
  )
}
