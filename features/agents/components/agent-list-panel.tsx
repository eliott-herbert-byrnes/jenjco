'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSelectedLayoutSegment } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { paths } from '@/app/paths'

type OrgAgent = {
  id: string
  display_name: string
  description: string | null
  is_active: boolean
}

export function AgentListPanel({ agents }: { agents: OrgAgent[] }) {
  const [search, setSearch] = useState('')
  const activeSegment = useSelectedLayoutSegment()

  const filtered = agents.filter(a =>
    a.display_name.toLowerCase().includes(search.toLowerCase())
  )

  const active = filtered.filter(a => a.id === activeSegment)
  const all = filtered

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <Input
        placeholder="Search agents..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {active.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-medium text-muted-foreground">Active</p>
          {active.map(agent => <AgentCard key={agent.id} agent={agent} isSelected />)}
        </section>
      )}

      <section>
        <p className="mb-2 text-xs font-medium text-muted-foreground">All Agents</p>
        {all.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            isSelected={agent.id === activeSegment}
          />
        ))}
      </section>
    </div>
  )
}

function AgentCard({ agent, isSelected }: { agent: OrgAgent; isSelected: boolean }) {
  return (
    <Link
      href={`${paths.agents}/${agent.id}`}
      className={`mb-2 block rounded-lg border p-3 transition-colors hover:bg-muted ${isSelected ? 'border-primary bg-muted' : ''}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm">{agent.display_name}</span>
        <Badge variant={agent.is_active ? 'default' : 'secondary'}>
          {agent.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      {agent.description && (
        <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{agent.description}</p>
      )}
    </Link>
  )
}