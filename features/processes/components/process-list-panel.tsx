'use client'

import { useDeferredValue, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSelectedLayoutSegment } from 'next/navigation'
import { ChevronDown } from 'lucide-react'
import { paths } from '@/app/paths'
import type { AppRole } from '@/lib/auth'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

export type ProcessListDepartment = {
  id: string
  name: string
  sort_order: number
  processes: {
    id: string
    title: string
    department_id: string
    slug: string
  }[]
}

export function ProcessListPanel({
  departments,
  role,
}: {
  departments: ProcessListDepartment[]
  role: AppRole
}) {
  const [search, setSearch] = useState('')
  const deferredSearch = useDeferredValue(search)
  const activeLayoutSegment = useSelectedLayoutSegment()

  const { visibleDepartments, hasQuery } = useMemo(() => {
    const q = deferredSearch.toLowerCase().trim()
    if (!q) {
      return { visibleDepartments: departments, hasQuery: false }
    }

    const mapped = departments
      .map((d) => ({
        ...d,
        processes: d.processes.filter((p) =>
          p.title.toLowerCase().includes(q)
        ),
      }))
      .filter((d) => d.processes.length > 0)

    return { visibleDepartments: mapped, hasQuery: true }
  }, [departments, deferredSearch])

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <Input
        placeholder="Search processes..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <nav className="flex flex-col gap-1">
        {hasQuery && visibleDepartments.length === 0 ? (
          <p className="px-2 py-4 text-sm text-muted-foreground">
            No matching processes
          </p>
        ) : (
          visibleDepartments.map((dept) => (
            <DepartmentSection
              key={dept.id}
              department={dept}
              role={role}
              activeLayoutSegment={activeLayoutSegment}
              forceOpen={hasQuery}
            />
          ))
        )}
      </nav>
    </div>
  )
}

function DepartmentSection({
  department,
  // role,
  activeLayoutSegment,
  forceOpen = false,
}: {
  department: ProcessListDepartment
  role: AppRole
  activeLayoutSegment: string | null
  forceOpen?: boolean
}) {
  return (
    <Collapsible
      defaultOpen={department.name === 'Operations'}
      open={forceOpen ? true : undefined}
      className="group"
    >
      <div className="flex items-center gap-0.5">
        <CollapsibleTrigger
          className={cn(
            'flex min-w-0 flex-1 items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm font-medium text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring'
          )}
        >
          <ChevronDown
            className={cn(
              'size-4 shrink-0 transition-transform duration-200',
              'group-data-[state=closed]:-rotate-90'
            )}
          />
          <span className="truncate">{department.name}</span>
        </CollapsibleTrigger>
        {/* Implement later post MVP */}
        {/* {role === 'admin' && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-7 shrink-0"
            disabled
            title="Create process via POST /api/processes (UI coming soon)"
          >
            <Plus className="size-4" />
          </Button>
        )} */}
      </div>
      <CollapsibleContent className="space-y-1 pt-1 pl-2">
        {department.processes.length === 0 ? (
          <p className="px-2 py-1 text-xs text-muted-foreground">
            No processes
          </p>
        ) : (
          department.processes.map((process) => (
            <ProcessRow
              key={process.id}
              process={process}
              isSelected={process.id === activeLayoutSegment}
            />
          ))
        )}
      </CollapsibleContent>
    </Collapsible>
  )
}

function ProcessRow({
  process,
  isSelected,
}: {
  process: ProcessListDepartment['processes'][number]
  isSelected: boolean
}) {
  return (
    <Link
      href={`${paths.processes}/${process.id}`}
      className={cn(
        'mb-1 block rounded-md border px-3 py-2 text-sm transition-colors hover:bg-muted',
        isSelected ? 'border-primary bg-muted' : 'border-transparent'
      )}
    >
      <span className="line-clamp-2 font-medium">{process.title}</span>
    </Link>
  )
}
