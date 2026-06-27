import { describe, expect, it } from 'vitest'

import {
  buildSystemLogsHref,
  buildSystemLogsSearchParams,
  localDateRangeToUtcBounds,
} from './date-range-filter'

describe('localDateRangeToUtcBounds', () => {
  it('converts Europe/London winter dates at UTC+0', () => {
    const { start, end } = localDateRangeToUtcBounds(
      '2024-01-15',
      '2024-01-15',
      'Europe/London',
    )

    expect(start).toBe('2024-01-15T00:00:00.000Z')
    expect(end).toBe('2024-01-16T00:00:00.000Z')
  })

  it('handles Europe/London BST offset on a summer date', () => {
    const { start } = localDateRangeToUtcBounds(
      '2024-07-15',
      '2024-07-15',
      'Europe/London',
    )

    expect(start).toBe('2024-07-14T23:00:00.000Z')
  })

  it('uses exclusive end bound for multi-day ranges', () => {
    const { start, end } = localDateRangeToUtcBounds(
      '2024-03-30',
      '2024-03-31',
      'Europe/London',
    )

    expect(start).toBe('2024-03-30T00:00:00.000Z')
    // April 1 00:00 Europe/London (BST) = March 31 23:00 UTC
    expect(end).toBe('2024-03-31T23:00:00.000Z')
  })
})

describe('buildSystemLogsSearchParams', () => {
  it('omits page when zero and includes filter params', () => {
    const params = buildSystemLogsSearchParams({
      page: 0,
      search: 'invoice',
      status: 'success',
      type: 'workflow',
      team: 'dept-1',
      from: '2024-01-01',
      to: '2024-01-31',
      tz: 'Europe/London',
    })

    expect(params.get('page')).toBeNull()
    expect(params.get('search')).toBe('invoice')
    expect(params.get('status')).toBe('success')
    expect(params.get('type')).toBe('workflow')
    expect(params.get('team')).toBe('dept-1')
    expect(params.get('from')).toBe('2024-01-01')
    expect(params.get('to')).toBe('2024-01-31')
    expect(params.get('tz')).toBe('Europe/London')
  })

  it('resets page via overrides', () => {
    const href = buildSystemLogsHref(
      { page: 3, search: 'foo', tz: 'UTC' },
      { page: undefined, search: 'bar' },
    )

    expect(href).toBe('/analytics/system-logs?search=bar&tz=UTC')
  })
})
