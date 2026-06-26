import { Badge } from '@/components/ui/badge'
import {
  BRAND_BADGE_CLASSES,
  BRAND_FILTER_SELECTED_CLASSES,
  type BrandColorKey,
} from '@/lib/brand-colors'
import { cn } from '@/lib/utils'

type DepartmentChipProps = {
  name: string
  colorKey: BrandColorKey
  selected?: boolean
  onClick?: () => void
}

const CHIP_BASE_CLASSES = 'rounded-full p-4 text-sm font-medium'

export function DepartmentChip({
  name,
  colorKey,
  selected = false,
  onClick,
}: DepartmentChipProps) {
  if (onClick) {
    return (
      <button
        type="button"
        className={cn(
          CHIP_BASE_CLASSES,
          'border',
          selected
            ? BRAND_FILTER_SELECTED_CLASSES[colorKey]
            : cn(
                BRAND_BADGE_CLASSES[colorKey],
                'cursor-pointer hover:opacity-80 px-4 py-2 border-none',
              ),
        )}
        onClick={onClick}
        aria-pressed={selected}
      >
        {name}
      </button>
    )
  }

  return (
    <Badge className={cn(BRAND_BADGE_CLASSES[colorKey], CHIP_BASE_CLASSES)}>
      {name}
    </Badge>
  )
}
