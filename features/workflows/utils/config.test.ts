import { describe, expect, it } from 'vitest'

import { parseWorkflowConfig } from './config'

describe('parseWorkflowConfig', () => {
  it('returns empty steps and edges for non-object input', () => {
    expect(parseWorkflowConfig(null)).toEqual({ steps: [], edges: [] })
    expect(parseWorkflowConfig(undefined)).toEqual({ steps: [], edges: [] })
    expect(parseWorkflowConfig('config')).toEqual({ steps: [], edges: [] })
    expect(parseWorkflowConfig(42)).toEqual({ steps: [], edges: [] })
  })

  it('parses valid steps and edges', () => {
    expect(
      parseWorkflowConfig({
        steps: [
          { id: 'a', label: 'Step A', description: 'First' },
          { id: 'b', label: 'Step B', description: 'Second' },
        ],
        edges: [{ source: 'a', target: 'b' }],
      })
    ).toEqual({
      steps: [
        { id: 'a', label: 'Step A', description: 'First' },
        { id: 'b', label: 'Step B', description: 'Second' },
      ],
      edges: [{ source: 'a', target: 'b' }],
      inputSchema: undefined,
    })
  })

  it('skips malformed steps and uses id as label fallback', () => {
    expect(
      parseWorkflowConfig({
        steps: [
          null,
          { id: 1 },
          { id: 'valid' },
          { id: 'minimal', label: 42, description: null },
        ],
      })
    ).toEqual({
      steps: [
        { id: 'valid', label: 'valid', description: '' },
        { id: 'minimal', label: 'minimal', description: '' },
      ],
      edges: [],
      inputSchema: undefined,
    })
  })

  it('skips edges without string source and target', () => {
    expect(
      parseWorkflowConfig({
        edges: [
          { source: 'a', target: 'b' },
          { source: 'a' },
          { target: 'b' },
          { source: 1, target: 2 },
          null,
        ],
      })
    ).toEqual({
      steps: [],
      edges: [{ source: 'a', target: 'b' }],
      inputSchema: undefined,
    })
  })

  it('includes inputSchema when present as an object', () => {
    const inputSchema = {
      type: 'object',
      properties: { topic: { type: 'string' } },
    }

    expect(
      parseWorkflowConfig({
        steps: [],
        edges: [],
        inputSchema,
      })
    ).toEqual({
      steps: [],
      edges: [],
      inputSchema,
    })
  })

  it('omits inputSchema when not an object', () => {
    expect(
      parseWorkflowConfig({
        steps: [],
        edges: [],
        inputSchema: 'invalid',
      })
    ).toEqual({
      steps: [],
      edges: [],
      inputSchema: undefined,
    })
  })
})
