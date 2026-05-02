"use client"

import Link from "next/link"

import { paths } from "@/app/paths"
import { cn } from "@/lib/utils"

type Tab = "agents" | "workflows"
type View = "metrics" | "invocations" | "logs"

const TABS: { id: Tab; label: string }[] = [
  { id: "agents", label: "Agents" },
  { id: "workflows", label: "Workflows" },
]
const VIEWS: { id: View; label: string }[] = [
  { id: "metrics", label: "Metrics" },
  { id: "invocations", label: "Invocations" },
  { id: "logs", label: "Logs" },
]

function href(tab: string, view: string) {
  return `${paths.audit}?tab=${tab}&view=${view}`
}

export function AuditNav({
  activeTab,
  activeView,
}: {
  activeTab: Tab
  activeView: View
}) {
  return (
    <div className="flex flex-col gap-2 border-b pb-4">
      <div className="flex gap-1">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={href(t.id, activeView)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeTab === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
      <div className="flex gap-1">
        {VIEWS.map((v) => (
          <Link
            key={v.id}
            href={href(activeTab, v.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              activeView === v.id
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {v.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
