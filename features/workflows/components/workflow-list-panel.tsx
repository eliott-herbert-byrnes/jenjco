'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSelectedLayoutSegment } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { paths } from '@/app/paths'

type OrgWorkflow = {
  id: string
  display_name: string
  description: string | null
  is_active: boolean
}

export function WorkflowListPanel({ workflows }: { workflows: OrgWorkflow[] }) {
  const [search, setSearch] = useState('')
  const activeSegment = useSelectedLayoutSegment()

  const filtered = workflows.filter(w =>
    w.display_name.toLowerCase().includes(search.toLowerCase())
  )

  const active = filtered.filter(w => w.id === activeSegment)
  const all = filtered

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <Input
        placeholder="Search workflows..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {active.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Active</p>
          {active.map(w => (
            <WorkflowCard key={w.id} workflow={w} isSelected />
          ))}
        </section>
      )}

      <section>
        <p className="mb-2 text-xs font-medium text-muted-foreground">All Workflows</p>
        {all.map(w => (
          <WorkflowCard
            key={w.id}
            workflow={w}
            isSelected={w.id === activeSegment}
          />
        ))}
      </section>
    </div>
  )
}

function WorkflowCard({ workflow, isSelected }: { workflow: OrgWorkflow; isSelected: boolean }) {
  return (
    <Link
      href={`${paths.workflows}/${workflow.id}`}
      className={`mb-2 block rounded-lg border p-3 transition-colors hover:bg-muted ${isSelected ? 'border-primary bg-muted' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm">{workflow.display_name}</span>
        <Badge
          variant={workflow.is_active ? 'default' : 'secondary'}
          className={
            workflow.is_active
              ? 'bg-emerald-600/5 border-emerald-600 text-emerald-600'
              : 'bg-red-600/5 border-red-600 text-red-600'
          }
        >
          {workflow.is_active ? 'Online' : 'Offline'}
        </Badge>
      </div>
      {workflow.description && (
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{workflow.description}</p>
      )}
    </Link>
  )
}
