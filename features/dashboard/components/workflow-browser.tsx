import { SearchIcon } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { WorkflowCard } from "@/features/dashboard/components/workflow-card"
import { STUB_WORKFLOWS } from "@/features/dashboard/data/stub-workflows"

type WorkflowBrowserProps = {
  departments: Array<{ id: string; name: string }>
}

export function WorkflowBrowser({ departments }: WorkflowBrowserProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <SearchIcon
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search workflows..."
          className="pl-9"
          readOnly
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-2">
        {departments.map((department) => (
          <Badge key={department.id} variant="secondary" className="p-4 hover:bg-secondary/50">
            {department.name}
          </Badge>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        {STUB_WORKFLOWS.map((workflow) => (
          <WorkflowCard key={workflow.id} workflow={workflow} />
        ))}
      </div>
    </div>
  )
}
