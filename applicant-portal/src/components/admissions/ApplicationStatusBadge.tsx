import { Badge } from '@/components/ui/badge'
import type { ApplicantWindowStatus } from '@/lib/api/types'
import { cn } from '@/lib/utils'

const statusCopy: Record<ApplicantWindowStatus, string> = {
  open: 'Applications Open',
  upcoming: 'Coming Soon',
  closed: 'Closed',
}

const statusClass: Record<ApplicantWindowStatus, string> = {
  open: 'border-transparent bg-[#dcfce7] text-[#166534]',
  upcoming: 'border-transparent bg-[#e0f2fe] text-[#075985]',
  closed: 'border-transparent bg-[#e2e8f0] text-[#475569]',
}

type Props = {
  status: ApplicantWindowStatus
  className?: string
}

export function ApplicationStatusBadge({ status, className }: Props) {
  return (
    <Badge className={cn('rounded-full px-2.5 py-0.5 font-semibold', statusClass[status], className)}>
      {statusCopy[status]}
    </Badge>
  )
}
