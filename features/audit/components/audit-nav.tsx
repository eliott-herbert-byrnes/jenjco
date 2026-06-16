"use client"

import Link from "next/link"

import { paths } from "@/app/paths"
import { cn } from "@/lib/utils"

type Tab = "workflows" | "integrations" | "logs"

const TABS: { id: Tab; label: string }[] = [
  { id: "workflows", label: "Workflows" },
  { id: "integrations", label: "Integrations" },
  { id: "logs", label: "System Logs" },
]

function tabHref(tab: Tab) {
  if (tab === "integrations") return `${paths.audit}?tab=integrations`
  if (tab === "logs") return `${paths.audit}?tab=logs`
  return `${paths.audit}?tab=workflows`
}

export function AuditNav({ activeTab }: { activeTab: Tab }) {
  return (
    <div className="flex flex-col gap-2 border-b pb-4">
      <div className="flex gap-1">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={tabHref(t.id)}
            className={cn(
              "rounded-3xl px-3 py-2 text-sm font-medium transition-colors",
              activeTab === t.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>
    </div>
  )
}
