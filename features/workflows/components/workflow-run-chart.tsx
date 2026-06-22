'use client'

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts'

import {
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart'
import type { WorkflowDailyRunRow } from '@/features/workflows/types'

const chartConfig = {
  successful_runs: {
    label: 'Successful',
    color: 'oklch(0.627 0.194 149.214)',
  },
  failed_runs: {
    label: 'Failed',
    color: 'var(--color-destructive)',
  },
} satisfies ChartConfig

function formatChartDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
  }).format(new Date(value))
}

export function WorkflowRunChart({
  dailyRuns,
}: {
  dailyRuns: WorkflowDailyRunRow[]
}) {
  if (dailyRuns.length === 0) {
    return (
      <div className="flex h-[160px] items-center justify-center text-sm text-muted-foreground">
        No run data for the last 7 days
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-[160px] w-full">
      <BarChart data={dailyRuns}>
        <CartesianGrid vertical={false} />
        <XAxis
          dataKey="run_date"
          tickLine={false}
          axisLine={false}
          tickFormatter={formatChartDate}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        <Bar
          dataKey="successful_runs"
          stackId="a"
          fill="var(--color-successful_runs)"
        />
        <Bar
          dataKey="failed_runs"
          stackId="a"
          fill="var(--color-failed_runs)"
        />
      </BarChart>
    </ChartContainer>
  )
}
