import { cn } from '@/lib/utils'

export type PillBadgeStyle = {
  badge: string
  dot: string
}

const badgeBase =
  'inline-flex h-7 w-fit shrink-0 items-center rounded-sm border-0 px-3 text-xs font-medium whitespace-nowrap'

export const pillBadgeStyles = {
  active: {
    badge: 'bg-[#d9f8eb] text-[#057a55]',
    dot: 'bg-[#00a768]',
  },
  inactive: {
    badge: 'bg-[#e9eef7] text-[#294477]',
    dot: 'bg-[#31518d]',
  },
  retired: {
    badge: 'bg-[#fef3c7] text-[#b45309]',
    dot: 'bg-[#f59e0b]',
  },
  draft: {
    badge: 'bg-[#e9eef7] text-[#31518d]',
    dot: 'bg-[#31518d]',
  },
  configured: {
    badge: 'bg-[#e3edff] text-[#0644ff]',
    dot: 'bg-[#0644ff]',
  },
  underReview: {
    badge: 'bg-[#fef3c7] text-[#b45309]',
    dot: 'bg-[#f59e0b]',
  },
  published: {
    badge: 'bg-[#d9f8eb] text-[#057a55]',
    dot: 'bg-[#00a768]',
  },
  closed: {
    badge: 'bg-[#e9eef7] text-[#294477]',
    dot: 'bg-[#31518d]',
  },
  muted: {
    badge: 'bg-[#f1f5fb] text-[#6374ab]',
    dot: 'bg-[#94a3b8]',
  },
} as const

type PillBadgeProps = {
  label: string
  style: PillBadgeStyle
  className?: string
}

export function PillBadge({ label, style, className }: PillBadgeProps) {
  return (
    <span className={cn(badgeBase, style.badge, className)}>
      <span className={cn('mr-1.5 h-2 w-2 shrink-0 rounded-full', style.dot)} />
      {label}
    </span>
  )
}
