import type { Edge, Node } from '@xyflow/react'

export type StepMeta = { id: string; label: string; description: string }
export type EdgeMeta = { source: string; target: string }

export type StepRunStatus = 'idle' | 'running' | 'success' | 'error'

const NODE_WIDTH = 200
const NODE_GAP = 360
const NODE_Y = 120

export function buildNodes(steps: StepMeta[]): Node[] {
  return steps.map((step, i) => ({
    id: step.id,
    type: 'workflowStep',
    position: { x: i * (NODE_WIDTH + NODE_GAP), y: NODE_Y },
    data: step,
  }))
}

export function buildEdges(edges: EdgeMeta[]): Edge[] {
  return edges.map((e) => ({
    id: `${e.source}-${e.target}`,
    source: e.source,
    target: e.target,
    type: 'default',
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
