import { PillBadge, pillBadgeStyles } from '@/components/shared/PillBadge'

type StatusBadgeProps = {
  status: 'Active' | 'Inactive' | 'Retired'
}

const statusStyles = {
  Active: pillBadgeStyles.active,
  Inactive: pillBadgeStyles.inactive,
  Retired: pillBadgeStyles.retired,
} as const

export function StatusBadge({ status }: StatusBadgeProps) {
  return <PillBadge label={status} style={statusStyles[status]} />
}
