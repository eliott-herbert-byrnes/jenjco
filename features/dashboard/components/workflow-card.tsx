import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ProviderIcon } from "@/lib/provider-icons"
import { cn } from "@/lib/utils"

type WorkflowCardProps = {
  id: string
  displayName: string
  departmentName: string | null
  departmentId: string | null
  providers: string[]
  badgeColorClass: string
}

export function WorkflowCard({
  id,
  displayName,
  departmentName,
  providers,
  badgeColorClass,
}: WorkflowCardProps) {
  const href = `/workflows/${id}`

  return (
    <Link href={href} className="block">
      <Card className="cursor-pointer transition-all duration-200 ease-in-out hover:scale-101">
        <CardHeader>
          {departmentName ? (
            <Badge className={badgeColorClass}>{departmentName}</Badge>
          ) : null}
          <CardTitle>{displayName}</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-between">
          <div className="flex gap-1">
            {providers.map((provider) => (
              <ProviderIcon
                key={provider}
                provider={provider}
                className="size-6.5 bg-neutral-200 p-1 rounded-lg border border-neutral-300"
              />
            ))}
          </div>
          <span className={cn(buttonVariants({ variant: "secondary" }))}>
            Execute
          </span>
        </CardContent>
      </Card>
    </Link>
  )
}
