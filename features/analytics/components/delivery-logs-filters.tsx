"use client"

import { SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useRef, useState } from "react"

import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { NOTIFICATION_EVENT_TYPES } from "@/features/workflows/notifications/types"
import { useDebouncedValue } from "@/hooks/use-debounced-value"
import {
  buildDeliveryLogsHref,
  type DeliveryLogsFilterParams,
} from "@/lib/delivery-logs-query"

const ALL = "__all__"

type DeliveryLogsFiltersProps = DeliveryLogsFilterParams

const EVENT_LABELS: Record<string, string> = {
  completion: "Completion",
  error: "Error",
  digest: "Digest",
  test: "Test",
}

export function DeliveryLogsFilters({
  search: initialSearch,
  status: initialStatus,
  event: initialEvent,
}: DeliveryLogsFiltersProps) {
  const router = useRouter()
  const skipSearchPush = useRef(true)

  const [search, setSearch] = useState(initialSearch ?? "")
  const [status, setStatus] = useState(initialStatus || ALL)
  const [event, setEvent] = useState(initialEvent || ALL)

  const debouncedSearch = useDebouncedValue(search)

  const navigate = (next: {
    search?: string
    status?: string
    event?: string
  } = {}) => {
    const href = buildDeliveryLogsHref({
      search: (next.search ?? debouncedSearch).trim() || undefined,
      status:
        (next.status ?? status) !== ALL ? (next.status ?? status) : undefined,
      event: (next.event ?? event) !== ALL ? (next.event ?? event) : undefined,
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

  const handleEventChange = (value: string) => {
    setEvent(value)
    navigate({ event: value })
  }

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
      <Field className="min-w-[200px] flex-1">
        <FieldLabel htmlFor="delivery-logs-search">Workflow</FieldLabel>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="delivery-logs-search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Filter by workflow name..."
            className="pl-9"
          />
        </div>
      </Field>

      <Field className="min-w-[140px] sm:w-[160px]">
        <FieldLabel htmlFor="delivery-logs-status">Status</FieldLabel>
        <Select value={status} onValueChange={handleStatusChange}>
          <SelectTrigger id="delivery-logs-status" className="w-full">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={ALL}>All statuses</SelectItem>
            <SelectItem value="sent">Sent</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="skipped">Skipped</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field className="min-w-[160px] sm:w-[180px]">
        <FieldLabel htmlFor="delivery-logs-event">Event</FieldLabel>
        <Select value={event} onValueChange={handleEventChange}>
          <SelectTrigger id="delivery-logs-event" className="w-full">
            <SelectValue placeholder="All events" />
          </SelectTrigger>
          <SelectContent position="popper">
            <SelectItem value={ALL}>All events</SelectItem>
            {NOTIFICATION_EVENT_TYPES.map((eventType) => (
              <SelectItem key={eventType} value={eventType}>
                {EVENT_LABELS[eventType] ?? eventType}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
    </div>
  )
}
