"use client"

import { Fragment, useMemo, useState } from "react"
import { ReactFlowProvider } from "@xyflow/react"
import { GitBranchIcon, NetworkIcon } from "lucide-react"
import { Canvas } from "@/components/ai-elements/canvas"
import { Panel } from "@/components/ai-elements/panel"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { buildOrgLayout, type DeptRow } from "../lib/layout"
import { OrgNode } from "./org-node"
import { Separator } from "@/components/ui/separator"

const nodeTypes = { orgNode: OrgNode }

export type OrgStructureCanvasProps = {
  orgName: string
  departments: DeptRow[]
}

export function OrgStructureCanvas({
  orgName,
  departments,
}: OrgStructureCanvasProps) {
  const [selectedDeptId, setSelectedDeptId] = useState<string | null>(null)
  const selectedDept =
    departments.find((d) => d.id === selectedDeptId) ?? null

  const { nodes, edges } = useMemo(
    () => buildOrgLayout(orgName, departments),
    [orgName, departments]
  )

  const totalProcesses = departments.reduce((s, d) => s + d.process_count, 0)
  const totalWorkflows = departments.reduce((s, d) => s + d.workflow_count, 0)
  const aami =
    totalWorkflows === 0
      ? "N/A"
      : `${Math.round((totalProcesses / totalWorkflows) * 100)}%`

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
          showBackground={false}
          className="h-full w-full"
          onNodeClick={(_e, node) => {
            if (!node.data.isRoot) setSelectedDeptId(node.id)
          }}
        >
          <Panel 
          style={{ marginLeft: 35, marginTop: 0 }}
          className="flex max-w-xs flex-col gap-1 rounded-md border bg-card/95 p-3 shadow-sm backdrop-blur-sm">
            <p className="text-sm font-semibold">{orgName}</p>
            <p className="text-xs text-muted-foreground">
              {totalProcesses} Processes
            </p>
            <p className="text-xs text-muted-foreground">
              {totalWorkflows} Active Workflows
            </p>
            <p className="text-xs text-muted-foreground">{aami} AAMI</p>
          </Panel>
        </Canvas>
        <Sheet
          open={selectedDeptId !== null}
          onOpenChange={(open) => {
            if (!open) setSelectedDeptId(null)
          }}
        >
          <SheetContent side="right" className="rounded-3xl p-2">
            <SheetHeader>
              <SheetTitle>{selectedDept?.name}</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-6 overflow-y-auto px-6 pb-8">
              <section className="flex flex-col gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Processes
                </p>
                {selectedDept?.process_names.map((name) => (
                  <Fragment key={name}>
                    <div className="flex items-center gap-2 rounded-sm bg-gray-400/10 p-2 text-sm">
                      <NetworkIcon className="size-4 shrink-0 text-muted-foreground ml-1 mr-1" />
                      {name}
                    </div>
                    <Separator />
                  </Fragment>
                ))}
                {selectedDept?.process_names.length === 0 && (
                  <p className="text-xs text-muted-foreground">No processes</p>
                )}
              </section>
              <section className="flex flex-col gap-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Workflows
                </p>
                {selectedDept?.workflow_names.map((name) => (
                    <div key={name} className="flex items-center gap-2 text-sm bg-gray-400/10 p-2 rounded">
                    <GitBranchIcon className="size-4 shrink-0 text-muted-foreground" />
                    {name}
                  </div>
                ))}
                {selectedDept?.workflow_names.length === 0 && (
                  <p className="text-xs text-muted-foreground">No workflows</p>
                )}
              </section>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </ReactFlowProvider>
  )
}
