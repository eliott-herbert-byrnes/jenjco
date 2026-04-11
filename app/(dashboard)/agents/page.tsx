import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Agents",
}

export default function AgentsPage() {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Agents</h2>
      <p className="text-sm text-muted-foreground">
        Agent directory and chat land in Phase 3a–3b.
      </p>
    </div>
  )
}
