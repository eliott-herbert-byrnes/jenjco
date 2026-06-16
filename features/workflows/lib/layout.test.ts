import { describe, expect, it } from 'vitest'

import { buildNodes, type StepMeta } from './layout'

const steps: StepMeta[] = [
  { id: 'step-1', label: 'Step 1', description: 'First' },
  { id: 'step-2', label: 'Step 2', description: 'Second' },
  { id: 'step-3', label: 'Step 3', description: 'Third' },
  { id: 'step-4', label: 'Step 4', description: 'Fourth' },
]

function sectionHeaders(nodes: ReturnType<typeof buildNodes>) {
  return nodes
    .filter((n) => n.type === 'sectionHeader')
    .map((n) => n.data as { label: string; subtitle?: string })
}

function stepIds(nodes: ReturnType<typeof buildNodes>) {
  return nodes.filter((n) => n.type === 'workflowStep').map((n) => n.id)
}

describe('buildNodes', () => {
  it('returns empty array for no steps', () => {
    expect(buildNodes([], 'Manual', false)).toEqual([])
  })

  it('single step → only Start section, no Flow or Output', () => {
    const single = [steps[0]]
    const nodes = buildNodes(single, 'Manual', false)

    expect(sectionHeaders(nodes)).toEqual([{ label: 'Start', subtitle: 'Manual' }])
    expect(stepIds(nodes)).toEqual(['step-1'])
  })

  it('multi-step with has_output false → Start + Flow, no Output', () => {
    const nodes = buildNodes(steps.slice(0, 3), 'Manual', false)

    expect(sectionHeaders(nodes).map((h) => h.label)).toEqual(['Start', 'Flow'])
    expect(stepIds(nodes)).toEqual(['step-1', 'step-2', 'step-3'])
  })

  it('multi-step with has_output true → Start + Flow + Output, last step under Output', () => {
    const nodes = buildNodes(steps, 'Manual', true)

    expect(sectionHeaders(nodes).map((h) => h.label)).toEqual([
      'Start',
      'Flow',
      'Output',
    ])
    expect(stepIds(nodes)).toEqual(['step-1', 'step-2', 'step-3', 'step-4'])
    expect(stepIds(nodes).at(-1)).toBe('step-4')

    const outputHeaderIndex = nodes.findIndex((n) => n.id === 'section-output')
    const lastStepIndex = nodes.findIndex((n) => n.id === 'step-4')
    expect(outputHeaderIndex).toBeGreaterThan(-1)
    expect(lastStepIndex).toBe(outputHeaderIndex + 1)
  })

  it('uses Manual trigger label when no schedule', () => {
    const nodes = buildNodes([steps[0]], 'Manual', false)
    const start = sectionHeaders(nodes)[0]

    expect(start.subtitle).toBe('Manual')
  })

  it('uses Cron trigger label when schedule is set', () => {
    const nodes = buildNodes([steps[0]], 'Cron: 0 9 * * *', false)
    const start = sectionHeaders(nodes)[0]

    expect(start.subtitle).toBe('Cron: 0 9 * * *')
  })

  it('positions nodes vertically with increasing y', () => {
    const nodes = buildNodes(steps.slice(0, 2), 'Manual', false)
    const ys = nodes.map((n) => n.position.y)

    for (let i = 1; i < ys.length; i++) {
      expect(ys[i]).toBeGreaterThan(ys[i - 1]!)
    }
  })

  it('positions all nodes at x = 0', () => {
    const nodes = buildNodes(steps, 'Manual', true)

    for (const node of nodes) {
      expect(node.position.x).toBe(0)
    }
  })
})
