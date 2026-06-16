import type { Edge, Node } from '@xyflow/react'
import { Position } from '@xyflow/react'

export type StepMeta = { id: string; label: string; description: string }
export type EdgeMeta = { source: string; target: string }
export type SectionHeaderData = { label: string; subtitle?: string }

export type StepRunStatus = 'idle' | 'running' | 'success' | 'error'

const NODE_X = 0
const SECTION_HEADER_HEIGHT = 48
const STEP_NODE_HEIGHT = 100
const SECTION_GAP = 32

export function buildNodes(
  steps: StepMeta[],
  triggerLabel: string,
  hasOutput: boolean,
): Node[] {
  if (steps.length === 0) return []

  const nodes: Node[] = []
  let y = 0

  const startStep = steps[0]
  const outputStep =
    hasOutput && steps.length > 1 ? steps[steps.length - 1] : undefined
  const flowSteps = outputStep ? steps.slice(1, -1) : steps.slice(1)

  const addSectionHeader = (id: string, label: string, subtitle?: string) => {
    nodes.push({
      id,
      type: 'sectionHeader',
      position: { x: NODE_X, y },
      data: { label, subtitle },
      selectable: false,
      draggable: false,
    })
    y += SECTION_HEADER_HEIGHT
  }

  const addStep = (step: StepMeta) => {
    nodes.push({
      id: step.id,
      type: 'workflowStep',
      position: { x: NODE_X, y },
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      data: step,
    })
    y += STEP_NODE_HEIGHT
  }

  addSectionHeader('section-start', 'Start', triggerLabel)
  addStep(startStep)

  if (flowSteps.length > 0) {
    y += SECTION_GAP
    addSectionHeader('section-flow', 'Flow')
    for (const step of flowSteps) {
      addStep(step)
    }
  }

  if (outputStep) {
    y += SECTION_GAP
    addSectionHeader('section-output', 'Output')
    addStep(outputStep)
  }

  return nodes
}

export function buildEdges(edges: EdgeMeta[]): Edge[] {
  return edges.map((e) => ({
    id: `${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    type: 'straight',
  }))
}

/** Edge styles during a run: animated into the running step, dashed for not-yet-reached. */
export function decorateEdgesForRunState(
  metaEdges: EdgeMeta[],
  stepStatuses: Record<string, StepRunStatus>
): Edge[] {
  const base = buildEdges(metaEdges)
  const hasActivity = Object.keys(stepStatuses).length > 0

  return base.map((e) => {
    let type = 'default'
    if (hasActivity) {
      if (stepStatuses[e.target] === 'running') type = 'animated'
      else if (
        stepStatuses[e.source] === 'success' &&
        stepStatuses[e.target] !== 'success' &&
        stepStatuses[e.target] !== 'error' &&
        stepStatuses[e.target] !== 'running'
      ) {
        type = 'temporary'
      }
    }
    return { ...e, type }
  })
}
