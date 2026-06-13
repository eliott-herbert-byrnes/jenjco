'use client'

import { useMemo, useState } from 'react'
import { useWorkflowRun } from '../hooks/use-workflow-run'
import { ReactFlowProvider } from '@xyflow/react'
import type { Node as RFNode, NodeProps } from '@xyflow/react'
import { Canvas } from '@/components/ai-elements/canvas'
import { Controls } from '@/components/ai-elements/controls'
import { Edge } from '@/components/ai-elements/edge'
import {
  Node,
  NodeContent,
  NodeDescription,
  NodeHeader,
  NodeTitle,
} from '@/components/ai-elements/node'
import { Panel } from '@/components/ai-elements/panel'
import { Button } from '@/components/ui/button'
import type { AppRole } from '@/lib/auth'
import { cn } from '@/lib/utils'
import { buildNodes, decorateEdgesForRunState } from '../lib/layout'
import type { StepMeta, StepRunStatus, WorkflowCanvasWorkflow } from '../types'
import { parseWorkflowConfig } from '../utils/config'
import { WorkflowRunDrawer } from './workflow-run-drawer'

type StepNodeData = StepMeta & { status?: StepRunStatus }

type WorkflowStepRfNode = RFNode<StepNodeData, 'workflowStep'>

function WorkflowStepNode({ data }: NodeProps<WorkflowStepRfNode>) {
  const status = data.status ?? 'idle'
  const statusRing =
    status === 'running'
      ? 'ring-2 ring-amber-400 ring-offset-2 ring-offset-background'
      : status === 'success'
        ? 'ring-2 ring-emerald-500 ring-offset-2 ring-offset-background'
        : status === 'error'
          ? 'ring-2 ring-red-500 ring-offset-2 ring-offset-background'
          : ''

  return (
    <Node handles={{ source: true, target: true }} className={cn('w-sm', statusRing)}>
      <NodeHeader>
        <NodeTitle>{data.label}</NodeTitle>
      </NodeHeader>
      <NodeContent>
        <NodeDescription>{data.description}</NodeDescription>
      </NodeContent>
    </Node>
  )
}

const nodeTypes = {
  workflowStep: WorkflowStepNode,
}

const edgeTypes = {
  animated: Edge.Animated,
  temporary: Edge.Temporary,
}

export type WorkflowCanvasProps = {
  workflow: WorkflowCanvasWorkflow
  role: AppRole
}

export function WorkflowCanvas({ workflow, role }: WorkflowCanvasProps) {
  const { steps, edges: edgeMeta, inputSchema } = useMemo(
    () => parseWorkflowConfig(workflow.config_overrides),
    [workflow.config_overrides]
  )

  const [drawerOpen, setDrawerOpen] = useState(false)
  const canRun = role === 'admin' && workflow.status === 'active'
  const { stepStatuses, run, running, result, runError, reset } = useWorkflowRun({
    workflowId: workflow.id,
    canRun,
  })

  const handleDrawerOpenChange = (next: boolean) => {
    if (next) reset()
    setDrawerOpen(next)
  }

  const nodes = useMemo(
    () =>
      buildNodes(steps).map((n) => ({
        ...n,
        data: {
          ...(n.data as StepMeta),
          status: stepStatuses[n.id] ?? 'idle',
        } satisfies StepNodeData,
      })),
    [steps, stepStatuses]
  )

  const edges = useMemo(
    () => decorateEdgesForRunState(edgeMeta, stepStatuses),
    [edgeMeta, stepStatuses]
  )

  return (
    <ReactFlowProvider>
      <div className="relative flex h-full min-h-0 w-full flex-1 flex-col">
        <Canvas
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          deleteKeyCode={null}
          selectionOnDrag={false}
          fitView
          className="h-full w-full"
        >
          <Controls className="shadow-none!" />
          <Panel className="m-4 flex max-w-md flex-col gap-2 rounded-md border bg-card/95 p-3 shadow-sm backdrop-blur-sm">
            <div>
              <h1 className="text-sm font-semibold">{workflow.display_name}</h1>
              {workflow.description ? (
                <p className="text-muted-foreground mt-1 text-xs">{workflow.description}</p>
              ) : null}
            </div>
            {role === 'admin' && (
              <Button
                type="button"
                size="sm"
                className="w-fit"
                disabled={workflow.status !== 'active'}
                onClick={() => setDrawerOpen(true)}
              >
                Run workflow
              </Button>
            )}
          </Panel>
        </Canvas>

        <WorkflowRunDrawer
          displayName={workflow.display_name}
          status={workflow.status}
          role={role}
          inputSchema={inputSchema}
          open={drawerOpen}
          onOpenChange={handleDrawerOpenChange}
          run={run}
          running={running}
          result={result}
          runError={runError}
        />
      </div>
    </ReactFlowProvider>
  )
}
