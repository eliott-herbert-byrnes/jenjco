import { paths } from '@/app/paths'

export type SystemLogsFilterParams = {
  page?: number
  search?: string
  status?: string
  type?: string
  team?: string
  from?: string
  to?: string
  tz?: string
}

type ZonedParts = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
  ms: number
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
    hourCycle: 'h23',
  })

  const parts = dtf.formatToParts(date)
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? '0')

  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
    ms: get('fractionalSecond') || 0,
  }
}

function localDateTimeToUtcMs(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  ms: number,
  timeZone: string,
): number {
  let utcMs = Date.UTC(year, month - 1, day, hour, minute, second, ms)

  for (let attempt = 0; attempt < 10; attempt++) {
    const zoned = getZonedParts(new Date(utcMs), timeZone)
    const zonedAsUtc = Date.UTC(
      zoned.year,
      zoned.month - 1,
      zoned.day,
      zoned.hour,
      zoned.minute,
      zoned.second,
      zoned.ms,
    )
    const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute, second, ms)
    const diff = targetAsUtc - zonedAsUtc

    if (diff === 0) {
      return utcMs
    }

    utcMs += diff
  }

  return utcMs
}

function parseDateParam(dateStr: string): {
  year: number
  month: number
  day: number
} {
  const [year, month, day] = dateStr.split('-').map(Number)

  if (!year || !month || !day) {
    throw new Error(`Invalid date param: ${dateStr}`)
  }

  return { year, month, day }
}

function addDaysToDateStr(dateStr: string, days: number): string {
  const { year, month, day } = parseDateParam(dateStr)
  const next = new Date(Date.UTC(year, month - 1, day + days))

  return next.toISOString().slice(0, 10)
}

export function getBrowserTimeZone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone
}

export function localDateRangeToUtcBounds(
  from: string,
  to: string,
  tz: string,
): { start: string; end: string } {
  const fromParts = parseDateParam(from)
  const startMs = localDateTimeToUtcMs(
    fromParts.year,
    fromParts.month,
    fromParts.day,
    0,
    0,
    0,
    0,
    tz,
  )

  const dayAfterTo = addDaysToDateStr(to, 1)
  const toEndParts = parseDateParam(dayAfterTo)
  const endMs = localDateTimeToUtcMs(
    toEndParts.year,
    toEndParts.month,
    toEndParts.day,
    0,
    0,
    0,
    0,
    tz,
  )

  return {
    start: new Date(startMs).toISOString(),
    end: new Date(endMs).toISOString(),
  }
}

export function buildSystemLogsSearchParams(
  filters: SystemLogsFilterParams,
  overrides: Partial<SystemLogsFilterParams> = {},
): URLSearchParams {
  const merged = { ...filters, ...overrides }
  const params = new URLSearchParams()

  if (merged.page != null && merged.page > 0) {
    params.set('page', String(merged.page))
  }
  if (merged.search) params.set('search', merged.search)
  if (merged.status) params.set('status', merged.status)
  if (merged.type) params.set('type', merged.type)
  if (merged.team) params.set('team', merged.team)
  if (merged.from) params.set('from', merged.from)
  if (merged.to) params.set('to', merged.to)
  if (merged.tz) params.set('tz', merged.tz)

  return params
}

export function buildSystemLogsHref(
  filters: SystemLogsFilterParams,
  overrides: Partial<SystemLogsFilterParams> = {},
): string {
  const params = buildSystemLogsSearchParams(filters, overrides)
  const qs = params.toString()

  return qs ? `${paths.analyticsSystemLogs}?${qs}` : paths.analyticsSystemLogs
}
