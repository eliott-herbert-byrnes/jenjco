'use client'

import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  formatDuration,
  formatDurationMs,
  isRunningRunStatus,
} from '@/features/workflows/lib/format-duration'
import type { WorkflowDetailStats } from '@/features/workflows/types'

function formatLastRunDuration(stats: WorkflowDetailStats): {
  value: string
  subLabel?: string
} {
  if (!stats.latest_run_created_at) {
    return { value: '—' }
  }

  if (isRunningRunStatus(stats.latest_run_status)) {
    return {
      value: formatDuration(stats.latest_run_created_at, new Date().toISOString()),
      subLabel: 'refreshes on next open',
    }
  }

  if (stats.latest_run_completed_at) {
    return {
      value: formatDuration(
        stats.latest_run_created_at,
        stats.latest_run_completed_at
      ),
    }
  }

  return { value: '—' }
}

export function WorkflowStatCards({
  stats,
}: {
  stats: WorkflowDetailStats | null
}) {
  const lastRunDuration = stats ? formatLastRunDuration(stats) : { value: '—' }

  const cards = [
    {
      label: 'Total Runs',
      value: stats?.total_runs.toLocaleString() ?? '—',
    },
    {
      label: 'Successful Runs',
      value: stats?.successful_runs.toLocaleString() ?? '—',
    },
    {
      label: 'Failed Runs',
      value: stats?.failed_runs.toLocaleString() ?? '—',
    },
    {
      label: 'Failure Rate',
      value: stats != null ? `${stats.failure_rate}%` : '—',
    },
    {
      label: 'Avg Duration',
      value: formatDurationMs(stats?.avg_duration_ms ?? null),
    },
    {
      label: 'Last Run Duration',
      value: lastRunDuration.value,
      subLabel: lastRunDuration.subLabel,
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-4">
      {cards.map((card) => (
        <Card key={card.label} size="sm">
          <CardHeader className="pb-2">
            <CardDescription>{card.label}</CardDescription>
            <CardTitle className="text-2xl tabular-nums">{card.value}</CardTitle>
            {card.subLabel ? (
              <p className="text-xs text-muted-foreground">{card.subLabel}</p>
            ) : null}
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
