import type { Metadata } from "next"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Dashboard",
}

/** Static placeholders — Phase 2c wires Supabase counts and usage_logs. */
const SUMMARY = [
  { label: "Agents", value: "3" },
  { label: "Workflows", value: "10" },
  { label: "Processes", value: "50" },
] as const

/** Pixel heights for placeholder bars (max container ~11rem) */
const TOKEN_BARS = [48, 78, 54, 96, 66, 84] as const

export default function DashboardHomePage() {
  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-3">
        {SUMMARY.map((item) => (
          <Card key={item.label} size="sm">
            <CardHeader className="pb-2">
              <CardDescription>{item.label}</CardDescription>
              <CardTitle className="text-3xl font-semibold tabular-nums">{item.value}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>AAMI</CardTitle>
            <CardDescription>Organizational maturity index (placeholder)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-semibold tabular-nums tracking-tight">0.34</p>
            <p className="mt-1 text-xs text-muted-foreground">Target benchmark · 0.50</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activity trend</CardTitle>
            <CardDescription>Last 30 days (placeholder)</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="aspect-5/2 w-full text-primary">
              <svg
                viewBox="0 0 120 48"
                className="size-full"
                preserveAspectRatio="none"
                aria-hidden
              >
                <polyline
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  points="0,40 20,38 40,32 60,24 80,18 100,12 120,6"
                />
              </svg>
            </div>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Token usage (30 days)</CardTitle>
          <CardDescription>Daily total tokens — placeholder until Phase 2c</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className="flex h-44 items-end justify-between gap-2 border-t border-border/60 pt-4"
            role="img"
            aria-label="Bar chart placeholder for token usage over six periods"
          >
            {TOKEN_BARS.map((h, i) => (
              <div
                key={i}
                className="flex min-w-0 flex-1 flex-col items-center gap-2"
              >
                <div
                  className="w-full max-w-14 rounded-t-sm bg-primary/80"
                  style={{ height: `${h}px` }}
                />
                <span className="text-[10px] text-muted-foreground">W{i + 1}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
