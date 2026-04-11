import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Org structure",
}

export default function OrgStructurePage() {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-lg font-semibold">Org structure</h2>
      <p className="text-sm text-muted-foreground">
        Phase 7a will render the department hierarchy diagram here.
      </p>
    </div>
  )
}
