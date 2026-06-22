"use client"

import { SearchIcon } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"

import { paths } from "@/app/paths"
import { Button } from "@/components/ui/button"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const ALL = "__all__"

type SystemLogsFiltersProps = {
  search?: string
  status?: string
  type?: string
}

export function SystemLogsFilters({
  search: initialSearch,
  status: initialStatus,
  type: initialType,
}: SystemLogsFiltersProps) {
  const router = useRouter()
  const [search, setSearch] = useState(initialSearch ?? "")
  const [status, setStatus] = useState(initialStatus || ALL)
  const [resourceType, setResourceType] = useState(initialType || ALL)

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()

    const params = new URLSearchParams()
    const trimmed = search.trim()

    if (trimmed) params.set("search", trimmed)
    if (status !== ALL) params.set("status", status)
    if (resourceType !== ALL) params.set("type", resourceType)

    const qs = params.toString()
    router.push(
      qs ? `${paths.analyticsSystemLogs}?${qs}` : paths.analyticsSystemLogs
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end"
    >
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
        <Select value={status} onValueChange={setStatus}>
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
        <Select value={resourceType} onValueChange={setResourceType}>
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

      <Button type="submit" variant="secondary">
        Apply filters
      </Button>
    </form>
  )
}
