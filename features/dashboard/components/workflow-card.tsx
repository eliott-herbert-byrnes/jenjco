import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { WorkflowStub } from "@/features/dashboard/data/stub-workflows"

type WorkflowCardProps = {
  workflow: WorkflowStub
}

export function WorkflowCard({ workflow }: WorkflowCardProps) {
  return (
    <Card className="transition-all duration-200 ease-in-out hover:scale-101">
      <CardHeader>
        <Badge variant="secondary">{workflow.departmentName}</Badge>
        <CardTitle>{workflow.displayName}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          {workflow.integrations.map((integration) => (
            <div
              key={integration.name}
              title={integration.name}
              className="size-6 rounded bg-muted"
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
