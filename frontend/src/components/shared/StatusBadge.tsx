import { Badge } from '@/components/ui/badge'

type StatusBadgeProps = {
  status: 'Active' | 'Inactive' | 'Retired'
}

const statusStyles = {
  Active: {
    badge: 'h-6 border-0 bg-[#d9f8eb] px-2.5 text-xs font-medium text-[#057a55]',
    dot: 'bg-[#00a768]',
  },
  Inactive: {
    badge: 'h-6 border-0 bg-[#e9eef7] px-2.5 text-xs font-medium text-[#294477]',
    dot: 'bg-[#31518d]',
  },
  Retired: {
    badge: 'h-6 border-0 bg-[#fef3c7] px-2.5 text-xs font-medium text-[#b45309]',
    dot: 'bg-[#f59e0b]',
  },
} as const

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = statusStyles[status]

  return (
    <Badge className={styles.badge}>
      <span className={`mr-1.5 h-2 w-2 rounded-full ${styles.dot}`} />
      {status}
    </Badge>
  )
}
