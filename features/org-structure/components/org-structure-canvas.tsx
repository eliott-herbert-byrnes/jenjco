"use client"

import { useMemo } from "react"
import { ReactFlowProvider } from "@xyflow/react"
import { Canvas } from "@/components/ai-elements/canvas"
import { Controls } from "@/components/ai-elements/controls"
import { Panel } from "@/components/ai-elements/panel"
import { buildOrgLayout, type DeptRow } from "../lib/layout"
import { OrgNode } from "./org-node"

const nodeTypes = { orgNode: OrgNode }

export type OrgStructureCanvasProps = {
  orgName: string
  departments: DeptRow[]
}

export function OrgStructureCanvas({
  orgName,
  departments,
}: OrgStructureCanvasProps) {
  const { nodes, edges } = useMemo(
    () => buildOrgLayout(orgName, departments),
    [orgName, departments]
  )

  if (departments.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
        No departments have been configured for this organisation.
      </div>
    )
  }

  return (
    <ReactFlowProvider>
      <div className="relative flex h-full min-h-0 w-full flex-1 flex-col">
        <Canvas
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          deleteKeyCode={null}
          selectionOnDrag={false}
          fitView
          className="h-full w-full"
        >
          <Controls className="shadow-none!" />
          <Panel className="m-4 flex max-w-xs flex-col gap-1 rounded-md border bg-card/95 p-3 shadow-sm backdrop-blur-sm">
            <p className="text-sm font-semibold">{orgName}</p>
            <p className="text-xs text-muted-foreground">
              Organisation structure
            </p>
          </Panel>
        </Canvas>
      </div>
    </ReactFlowProvider>
  )
}
