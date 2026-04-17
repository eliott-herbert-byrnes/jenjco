import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Processes",
}

export default function ProcessesPage() {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Processes</h2>
      <p className="text-sm text-muted-foreground">
        Phase 4a–4c will surface process documents here.
      </p>
    </div>
  )
}
