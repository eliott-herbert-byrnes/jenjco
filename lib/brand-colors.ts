import { isRunningRunStatus } from '@/features/workflows/lib/format-duration'
import { cn } from '@/lib/utils'

export const BRAND_COLOR_KEYS = [
  'orange',
  'violet',
  'amber',
  'sky',
  'emerald',
] as const

export type BrandColorKey = (typeof BRAND_COLOR_KEYS)[number]

export function isBrandColorKey(v: unknown): v is BrandColorKey {
  return BRAND_COLOR_KEYS.includes(v as BrandColorKey)
}

export function buildDepartmentColorMap(
  departments: { id: string; color?: string | null }[],
): Map<string, BrandColorKey> {
  const map = new Map<string, BrandColorKey>()

  departments.forEach((dept, i) => {
    const color = isBrandColorKey(dept.color)
      ? dept.color
      : BRAND_COLOR_KEYS[i % BRAND_COLOR_KEYS.length]
    map.set(dept.id, color)
  })

  return map
}

export const BRAND_BADGE_CLASSES: Record<BrandColorKey, string> = {
  orange: 'bg-brand-orange/15 text-brand-orange',
  violet: 'bg-brand-violet/20 text-violet-900 dark:text-brand-violet',
  amber: 'bg-brand-amber/25 text-amber-900 dark:text-amber-300',
  sky: 'bg-brand-sky/15 text-brand-sky',
  emerald: 'bg-brand-emerald/15 text-brand-emerald',
}

export const BRAND_FILTER_SELECTED_CLASSES: Record<BrandColorKey, string> = {
  orange: 'border-brand-orange bg-brand-orange/30 text-brand-orange',
  violet:
    'border-brand-violet bg-brand-violet/30 text-violet-900 dark:text-brand-violet',
  amber: 'border-brand-amber bg-brand-amber/30 text-amber-900 dark:bg-brand-amber/30 dark:text-amber-300',
  sky: 'border-brand-sky bg-brand-sky/30 text-brand-sky',
  emerald: 'border-brand-emerald bg-brand-emerald/30 text-brand-emerald',
}

export const WORKFLOW_STATUS_BADGE_CLASSES = {
  active: `${BRAND_BADGE_CLASSES.emerald} rounded-full`,
  flagged: `${BRAND_BADGE_CLASSES.orange} rounded-full`,
  inactive: 'rounded-full',
} as const

export const RUN_SUCCESS_BADGE_CLASS = `${BRAND_BADGE_CLASSES.emerald} rounded-full`

export const RUNNING_BADGE_CLASS = `${BRAND_BADGE_CLASSES.amber} rounded-full`

export const STAT_CARD_VALUE_CLASSES = {
  neutral: '',
  success: 'text-brand-emerald',
  warning: 'text-brand-orange',
  running: 'text-brand-amber',
} as const

export const STEP_KIND_BADGE_CLASSES = {
  deterministic: `${BRAND_BADGE_CLASSES.sky} rounded-full`,
  ai: `${BRAND_BADGE_CLASSES.violet} rounded-full`,
} as const

export const USAGE_LOG_STATUS_BADGE_CLASSES = {
  success: RUN_SUCCESS_BADGE_CLASS,
  error: `${BRAND_BADGE_CLASSES.orange} rounded-full`,
} as const

export function departmentBadgeClass(
  departmentId: string | null,
  colorMap: Map<string, BrandColorKey>,
): string {
  const colorKey =
    (departmentId ? colorMap.get(departmentId) : undefined) ?? 'emerald'

  return cn(BRAND_BADGE_CLASSES[colorKey], 'rounded-full')
}

export function getLastRunDurationValueClass(
  latestRunStatus: string | null,
): string {
  if (!latestRunStatus) {
    return STAT_CARD_VALUE_CLASSES.neutral
  }

  if (isRunningRunStatus(latestRunStatus)) {
    return STAT_CARD_VALUE_CLASSES.running
  }

  if (latestRunStatus === 'completed') {
    return STAT_CARD_VALUE_CLASSES.success
  }

  if (latestRunStatus === 'failed' || latestRunStatus === 'cancelled') {
    return STAT_CARD_VALUE_CLASSES.warning
  }

  return STAT_CARD_VALUE_CLASSES.neutral
}
