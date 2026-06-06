'use client'

import { useMemo, useState } from 'react'
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
import { buildNodes, decorateEdgesForRunState, type EdgeMeta, type StepMeta, type StepRunStatus } from '../lib/layout'
import { WorkflowRunDrawer } from './workflow-run-drawer'

export type WorkflowCanvasWorkflow = {
  id: string
  workflow_key: string
  display_name: string
  description: string | null
  is_active: boolean
  config_overrides: unknown
  created_at: string
}

type StepNodeData = StepMeta & { status?: StepRunStatus }

type WorkflowStepRfNode = RFNode<StepNodeData, 'workflowStep'>

function parseWorkflowConfig(raw: unknown): {
  steps: StepMeta[]
  edges: EdgeMeta[]
  inputSchema?: Record<string, unknown>
} {
  if (!raw || typeof raw !== 'object') return { steps: [], edges: [] }
  const o = raw as Record<string, unknown>
  const steps: StepMeta[] = []
  const edges: EdgeMeta[] = []

  if (Array.isArray(o.steps)) {
    for (const s of o.steps) {
      if (!s || typeof s !== 'object') continue
      const r = s as Record<string, unknown>
      const id = typeof r.id === 'string' ? r.id : null
      if (!id) continue
      steps.push({
        id,
        label: typeof r.label === 'string' ? r.label : id,
        description: typeof r.description === 'string' ? r.description : '',
      })
    }
  }

  if (Array.isArray(o.edges)) {
    for (const e of o.edges) {
      if (!e || typeof e !== 'object') continue
      const r = e as Record<string, unknown>
      if (typeof r.source === 'string' && typeof r.target === 'string') {
        edges.push({ source: r.source, target: r.target })
      }
    }
  }

  const inputSchema =
    o.inputSchema && typeof o.inputSchema === 'object'
      ? (o.inputSchema as Record<string, unknown>)
      : undefined

  return { steps, edges, inputSchema }
}

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

  const [stepStatuses, setStepStatuses] = useState<Record<string, StepRunStatus>>({})
  const [drawerOpen, setDrawerOpen] = useState(false)

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
                disabled={!workflow.is_active}
                onClick={() => setDrawerOpen(true)}
              >
                Run workflow
              </Button>
            )}
          </Panel>
        </Canvas>

        <WorkflowRunDrawer
          workflowId={workflow.id}
          displayName={workflow.display_name}
          isActive={workflow.is_active}
          role={role}
          inputSchema={inputSchema}
          setStepStatuses={setStepStatuses}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
        />
      </div>
    </ReactFlowProvider>
  )
}
