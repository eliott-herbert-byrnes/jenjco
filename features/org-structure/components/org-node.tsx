"use client"

import { Handle, type Node as RFNode, type NodeProps, Position } from "@xyflow/react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { BRAND_BADGE_CLASSES } from "@/lib/brand-colors"
import { cn } from "@/lib/utils"
import type { OrgNodeData } from "../lib/layout"
import Image from "next/image"

type OrgRfNode = RFNode<OrgNodeData, "orgNode">

export function OrgNode({ data }: NodeProps<OrgRfNode>) {
  return (
    <Card
      className={cn(
        "relative w-[180px] gap-0 rounded-md p-0",
        data.isRoot && "border-primary",
        !data.isRoot &&
          "cursor-pointer transition-all duration-200 ease-in-out hover:scale-101"
      )}
    >
      {!data.isRoot && <Handle type="target" position={Position.Top} />}

      <CardHeader
        className={cn(
          "flex flex-row items-center gap-2 rounded-t-md border-b p-3!",
          data.color ? BRAND_BADGE_CLASSES[data.color] : "bg-secondary"
        )}
      >
        {data.isRoot &&
          (data.logoUrl ? (
            <Image
              src={data.logoUrl}
              alt="org logo"
              width={60}
              height={60}
              className="size-6 rounded-full object-contain border border-neutral-200"
            />
          ) : (
            <span className="inline-flex size-6 shrink-0 items-center justify-center rounded-full border bg-muted text-xs font-semibold" />
          ))}
        <CardTitle className="text-sm">{data.label}</CardTitle>
      </CardHeader>

      {!data.isRoot && (
        <CardContent className="flex flex-wrap gap-2 p-3">
          <Badge variant="secondary" className="text-xs">
            {data.processCount ?? 0}{" "}
            {data.processCount === 1 ? "process" : "processes"}
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {data.workflowCount ?? 0}{" "}
            {data.workflowCount === 1 ? "Workflow" : "Workflows"}
          </Badge>
        </CardContent>
      )}

      <Handle type="source" position={Position.Bottom} />
    </Card>
  )
}
