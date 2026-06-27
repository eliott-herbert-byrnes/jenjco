"use client"

import { Badge } from "@/components/ui/badge"
import type { DeliveryLogRow } from "@/lib/delivery-logs-query"
import { cn } from "@/lib/utils"

const STATUS_BADGE_CLASSES: Record<string, string> = {
  sent: "border-transparent bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  failed: "border-transparent bg-red-500/15 text-red-700 dark:text-red-400",
  skipped:
    "border-transparent bg-muted text-muted-foreground",
}

const EVENT_LABELS: Record<string, string> = {
  completion: "Completion",
  error: "Error",
  digest: "Digest",
  test: "Test",
}

const MODE_LABELS: Record<string, string> = {
  immediate: "Immediate",
  digest: "Digest",
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString()
}

function statusBadge(status: string) {
  const className = STATUS_BADGE_CLASSES[status]

  return (
    <Badge className={className} variant={className ? undefined : "outline"}>
      {status}
    </Badge>
  )
}

type DeliveryLogsTableProps = {
  rows: DeliveryLogRow[]
}

export function DeliveryLogsTable({ rows }: DeliveryLogsTableProps) {
  if (!rows.length) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        No delivery logs match your filters
      </p>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full font-mono text-xs">
        <thead className="border-b bg-muted/50">
          <tr>
            {[
              "Sent at",
              "Workflow",
              "Event",
              "Recipient",
              "Mode",
              "Status",
              "Error",
            ].map((header) => (
              <th
                key={header}
                className={cn(
                  "px-4 py-2 text-left font-medium text-muted-foreground",
                  header === "Error" && "min-w-[200px]",
                )}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b last:border-0">
              <td className="px-4 py-1.5 text-muted-foreground">
                {formatTimestamp(row.created_at)}
              </td>
              <td className="px-4 py-1.5">
                {row.org_workflows?.display_name ?? "—"}
              </td>
              <td className="px-4 py-1.5">
                {EVENT_LABELS[row.event_type] ?? row.event_type}
              </td>
              <td className="px-4 py-1.5">{row.recipient_email}</td>
              <td className="px-4 py-1.5">
                {MODE_LABELS[row.delivery_mode] ?? row.delivery_mode}
              </td>
              <td className="px-4 py-1.5">{statusBadge(row.status)}</td>
              <td
                className="max-w-xs truncate px-4 py-1.5 text-muted-foreground"
                title={row.error_message ?? undefined}
              >
                {row.error_message ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
