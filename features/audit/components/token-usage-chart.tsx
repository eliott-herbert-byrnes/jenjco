"use client"

import { Bar, BarChart, XAxis, YAxis } from "recharts"

import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

type DayPoint = { date: string; tokens: number }

const CHART_CONFIG = {
  tokens: { label: "Tokens", color: "hsl(var(--chart-1))" },
}

export function TokenUsageChart({ data }: { data: DayPoint[] }) {
  if (!data.length) {
    return (
      <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">
        No usage data for this period
      </div>
    )
  }

  return (
    <ChartContainer config={CHART_CONFIG} className="h-44 w-full">
      <BarChart data={data} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
        <XAxis
          dataKey="date"
          tick={{ fontSize: 10 }}
          tickFormatter={(d) => d.slice(5)}
        />
        <YAxis tick={{ fontSize: 10 }} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Bar
          dataKey="tokens"
          fill="var(--color-tokens)"
          radius={[2, 2, 0, 0]}
        />
      </BarChart>
    </ChartContainer>
  )
}
