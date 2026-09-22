import { Badge } from '@/components/ui/badge'

type MandatoryBadgeProps = {
  mandatory: 'Yes' | 'No'
}

export function MandatoryBadge({ mandatory }: MandatoryBadgeProps) {
  const isYes = mandatory === 'Yes'

  return (
    <Badge
      className={
        isYes
          ? 'h-6 border-0 bg-[#d9f8eb] px-2.5 text-xs font-medium text-[#057a55]'
          : 'h-6 border-0 bg-[#e9eef7] px-2.5 text-xs font-medium text-[#294477]'
      }
    >
      {mandatory}
    </Badge>
  )
}
