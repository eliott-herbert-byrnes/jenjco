import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Audit",
}

export default function AuditPage() {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Audit</h2>
      <p className="text-sm text-muted-foreground">
        Phase 6a–6c will add usage metrics and traces here.
      </p>
    </div>
  )
}
