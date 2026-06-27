import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { AnalyticsOverviewMetrics } from "@/features/analytics/types"
import { STAT_CARD_VALUE_CLASSES } from "@/lib/brand-colors"
import { cn } from "@/lib/utils"

function formatRunTime(ms: number | null): string {
  if (ms == null) return "—"
  if (ms >= 1000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms)}ms`
}

export function OverviewMetrics({
  metrics,
}: {
  metrics: AnalyticsOverviewMetrics
}) {
  const cards = [
    {
      label: "Month Executions",
      value: metrics.total_runs_month.toLocaleString(),
      valueClass: STAT_CARD_VALUE_CLASSES.neutral,
    },
    {
      label: "Week Executions",
      value: metrics.total_runs_week.toLocaleString(),
      valueClass: STAT_CARD_VALUE_CLASSES.neutral,
    },
    {
      label: "Today Executions",
      value: metrics.total_runs_today.toLocaleString(),
      valueClass: STAT_CARD_VALUE_CLASSES.neutral,
    },
    {
      label: "Failures (30d)",
      value: metrics.total_failures_month.toLocaleString(),
      valueClass: STAT_CARD_VALUE_CLASSES.warning,
    },
    {
      label: "Failure Rate",
      value: `${metrics.failure_rate_month}%`,
      valueClass: STAT_CARD_VALUE_CLASSES.warning,
    },
    {
      label: "Avg Run Time",
      value: formatRunTime(metrics.avg_run_time_ms),
      valueClass: STAT_CARD_VALUE_CLASSES.neutral,
    },
  ]

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <Card key={card.label} size="sm">
          <CardHeader className="pb-2">
            <CardDescription>{card.label}</CardDescription>
            <CardTitle
              className={cn('text-2xl tabular-nums', card.valueClass)}
            >
              {card.value}
            </CardTitle>
          </CardHeader>
        </Card>
      ))}
    </div>
  )
}
