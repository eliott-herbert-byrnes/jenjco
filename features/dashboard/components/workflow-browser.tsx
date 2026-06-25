"use client"

import { SearchIcon } from "lucide-react"
import { useEffect, useMemo, useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { WorkflowCard } from "@/features/dashboard/components/workflow-card"
import type { WorkflowHubRow } from "@/features/workflows/types"
import {
  BRAND_BADGE_CLASSES,
  buildDepartmentColorMap,
} from "@/lib/brand-colors"

const SEARCH_DEBOUNCE_MS = 300

type WorkflowBrowserProps = {
  departments: Array<{ id: string; name: string }>
  workflows: WorkflowHubRow[]
}

export function WorkflowBrowser({ departments, workflows }: WorkflowBrowserProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("")

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearchQuery(searchQuery)
    }, SEARCH_DEBOUNCE_MS)

    return () => window.clearTimeout(timer)
  }, [searchQuery])

  const departmentColorMap = buildDepartmentColorMap(departments)

  const filteredWorkflows = useMemo(() => {
    const query = debouncedSearchQuery.trim().toLowerCase()
    if (!query) return workflows

    return workflows.filter((workflow) =>
      workflow.display_name.toLowerCase().includes(query),
    )
  }, [workflows, debouncedSearchQuery])

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search workflows..."
          className="pl-9"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>
      <div className="mb-2 flex flex-wrap gap-2">
        {departments.map((department) => {
          const colorKey = departmentColorMap.get(department.id)
          const badgeClass = colorKey
            ? BRAND_BADGE_CLASSES[colorKey]
            : BRAND_BADGE_CLASSES.emerald

          return (
            <Badge
              key={department.id}
              className={`${badgeClass} p-4 hover:opacity-80`}
            >
              {department.name}
            </Badge>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {filteredWorkflows.length === 0 && debouncedSearchQuery.trim() ? (
          <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">
            No workflows match your search.
          </p>
        ) : (
          filteredWorkflows.map((workflow) => {
            const colorKey = workflow.department_id
              ? departmentColorMap.get(workflow.department_id)
              : undefined
            const badgeColorClass = colorKey
              ? BRAND_BADGE_CLASSES[colorKey]
              : BRAND_BADGE_CLASSES.emerald

            return (
              <WorkflowCard
                key={workflow.id}
                id={workflow.id}
                displayName={workflow.display_name}
                departmentName={workflow.department_name}
                departmentId={workflow.department_id}
                providers={workflow.providers}
                badgeColorClass={badgeColorClass}
              />
            )
          })
        )}
      </div>
    </div>
  )
}
