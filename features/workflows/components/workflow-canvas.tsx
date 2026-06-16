'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useWorkflowRun } from '../hooks/use-workflow-run'
import { ReactFlowProvider } from '@xyflow/react'
import type { Node as RFNode, NodeProps } from '@xyflow/react'
import { paths } from '@/app/paths'
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
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { AppRole } from '@/lib/auth'
import { cn } from '@/lib/utils'
import {
  buildNodes,
  decorateEdgesForRunState,
  type SectionHeaderData,
} from '../lib/layout'
import type { StepMeta, StepRunStatus, WorkflowCanvasWorkflow } from '../types'
import { parseWorkflowConfig } from '../utils/config'
import { WorkflowStepPanel } from './workflow-step-panel'
import { ChevronLeft } from 'lucide-react'

type StepNodeData = StepMeta & { status?: StepRunStatus }

type WorkflowStepRfNode = RFNode<StepNodeData, 'workflowStep'>
type SectionHeaderRfNode = RFNode<SectionHeaderData, 'sectionHeader'>

function WorkflowSectionNode({ data }: NodeProps<SectionHeaderRfNode>) {
  return (
    <div className="pointer-events-none flex select-none flex-col gap-0.5">
      <p className="text-muted-foreground text-xs font-semibold tracking-widest uppercase">
        {data.label}
      </p>
      {data.subtitle ? (
        <p className="text-muted-foreground text-xs">{data.subtitle}</p>
      ) : null}
    </div>
  )
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
    <Node
      handles={{ source: true, target: true }}
      orientation="vertical"
      className={cn('w-sm', statusRing)}
    >
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
  sectionHeader: WorkflowSectionNode,
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

  const [selectedStep, setSelectedStep] = useState<StepMeta | null>(steps[0] ?? null)
  const [panelMode, setPanelMode] = useState<'step' | 'run'>('step')
  const canRun = role === 'admin' && workflow.status === 'active'
  const { stepStatuses, run, running, result, runError, reset } = useWorkflowRun({
    workflowId: workflow.id,
    canRun,
  })

  const triggerLabel = workflow.schedule_cron
    ? `Cron: ${workflow.schedule_cron}`
    : 'Manual'

  const nodes = useMemo(
    () =>
      buildNodes(steps, triggerLabel, workflow.has_output).map((n) => {
        if (n.type === 'sectionHeader') return n
        return {
          ...n,
          data: {
            ...(n.data as StepMeta),
            status: stepStatuses[n.id] ?? 'idle',
          } satisfies StepNodeData,
        }
      }),
    [steps, triggerLabel, workflow.has_output, stepStatuses]
  )

  const edges = useMemo(
    () => decorateEdgesForRunState(edgeMeta, stepStatuses),
    [edgeMeta, stepStatuses]
  )

  const handleNodeClick = (_: React.MouseEvent, node: RFNode) => {
    const step = steps.find((s) => s.id === node.id)
    if (step) {
      setSelectedStep(step)
      if (panelMode === 'run') setPanelMode('step')
    }
  }

  const handleBackToStep = () => {
    reset()
    setPanelMode('step')
  }

  const handleSwitchToRun = () => {
    reset()
    setPanelMode('run')
  }

  return (
    <ReactFlowProvider>
      <div className="flex h-[calc(100vh-4.5rem)] flex-col">
        <TooltipProvider>
          <div className="flex shrink-0 items-center gap-2 border-b px-4 py-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={paths.workflows}>
              <ChevronLeft /> 
              Workflows
              </Link>
            </Button>
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button variant="outline" size="sm" disabled>
                    Test
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Disabled for MVP</TooltipContent>
            </Tooltip>
            <Button size="sm" disabled={!canRun} onClick={handleSwitchToRun}>
              Run
            </Button>
          </div>
        </TooltipProvider>

        <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
          <div className="min-h-0 flex-1 lg:w-2/3">
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
              onNodeClick={handleNodeClick}
            >
              <Controls className="shadow-none!" />
            </Canvas>
          </div>

          <div className="w-full shrink-0 overflow-y-auto border-t lg:w-1/3 lg:border-t-0 lg:border-l">
            <WorkflowStepPanel
              steps={steps}
              selectedStep={selectedStep}
              panelMode={panelMode}
              role={role}
              workflow={workflow}
              inputSchema={inputSchema}
              run={run}
              running={running}
              result={result}
              runError={runError}
              onSwitchToRun={handleSwitchToRun}
              onBackToStep={handleBackToStep}
            />
          </div>
        </div>
      </div>
    </ReactFlowProvider>
  )
}
