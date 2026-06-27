import { Badge } from '@/components/ui/badge'
import {
  BRAND_BADGE_CLASSES,
  BRAND_FILTER_SELECTED_CLASSES,
  type BrandColorKey,
} from '@/lib/brand-colors'
import { cn } from '@/lib/utils'
import { Button } from './ui/button'

type DepartmentChipProps = {
  name: string
  colorKey: BrandColorKey
  selected?: boolean
  onClick?: () => void
}

const CHIP_BASE_CLASSES = `rounded-full px-4 py-4 text-sm font-medium hover:bg-${BRAND_BADGE_CLASSES}`

export function DepartmentChip({
  name,
  colorKey,
  selected = false,
  onClick,
}: DepartmentChipProps) {
  if (onClick) {
    return (
      <Button
        className={cn(
          CHIP_BASE_CLASSES,
          'border',
          selected
            ? BRAND_FILTER_SELECTED_CLASSES[colorKey]
            : cn(
              BRAND_BADGE_CLASSES[colorKey],
              'cursor-pointer px-4 py-2 border-none',
            ),
        )}
        onClick={onClick}
        aria-pressed={selected}

      >
        {name}
      </Button>
    )
  }

  return (
    <Badge className={cn(BRAND_BADGE_CLASSES[colorKey], CHIP_BASE_CLASSES)}>
      {name}
    </Badge>
  )
}
