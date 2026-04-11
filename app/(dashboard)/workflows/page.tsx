import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Workflows",
}

export default function WorkflowsPage() {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Workflows</h2>
      <p className="text-sm text-muted-foreground">Phase 5a–5c will list org workflows here.</p>
    </div>
  )
}
