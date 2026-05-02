"use client"

import { Handle, type Node as RFNode, type NodeProps, Position } from "@xyflow/react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { OrgNodeData } from "../lib/layout"

type OrgRfNode = RFNode<OrgNodeData, "orgNode">

export function OrgNode({ data }: NodeProps<OrgRfNode>) {
  return (
    <Card
      className={cn(
        "relative w-[180px] gap-0 rounded-md p-0",
        data.isRoot && "border-primary"
      )}
    >
      {!data.isRoot && <Handle type="target" position={Position.Top} />}

      <CardHeader className="gap-0 rounded-t-md border-b bg-secondary p-3!">
        <CardTitle className="text-sm">{data.label}</CardTitle>
      </CardHeader>

      {!data.isRoot && (
        <CardContent className="p-3">
          <Badge variant="secondary" className="text-xs">
            {data.processCount ?? 0}{" "}
            {data.processCount === 1 ? "process" : "processes"}
          </Badge>
        </CardContent>
      )}

      <Handle type="source" position={Position.Bottom} />
    </Card>
  )
}
