export const BRAND_COLOR_KEYS = [
  "orange",
  "violet",
  "amber",
  "sky",
  "emerald",
] as const

export type BrandColorKey = (typeof BRAND_COLOR_KEYS)[number]

export function buildDepartmentColorMap(
  departments: { id: string }[],
): Map<string, BrandColorKey> {
  const map = new Map<string, BrandColorKey>()

  departments.forEach((dept, i) => {
    map.set(dept.id, BRAND_COLOR_KEYS[i % BRAND_COLOR_KEYS.length])
  })

  return map
}

export const BRAND_BADGE_CLASSES: Record<BrandColorKey, string> = {
  orange: "bg-brand-orange/15 text-brand-orange",
  violet: "bg-brand-violet/20 text-violet-900 dark:text-brand-violet",
  amber: "bg-brand-amber/25 text-amber-900",
  sky: "bg-brand-sky/15 text-brand-sky",
  emerald: "bg-brand-emerald/15 text-brand-emerald",
}
