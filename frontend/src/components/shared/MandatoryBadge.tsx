import { PillBadge, pillBadgeStyles } from '@/components/shared/PillBadge'

type MandatoryBadgeProps = {
  mandatory: 'Yes' | 'No'
}

export function MandatoryBadge({ mandatory }: MandatoryBadgeProps) {
  const isYes = mandatory === 'Yes'

  return (
    <PillBadge
      label={mandatory}
      style={isYes ? pillBadgeStyles.active : pillBadgeStyles.muted}
    />
  )
}
