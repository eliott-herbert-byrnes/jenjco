import type { EdgeMeta, StepMeta } from '../types'

export function parseWorkflowConfig(raw: unknown): {
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
