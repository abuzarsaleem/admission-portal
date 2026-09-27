import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import {
  applicationPath,
  getActiveApplication,
} from '@/lib/application-session'
import { cn } from '@/lib/utils'

type Props = {
  intakeId: string
  offeringId?: string
  className?: string
  size?: 'sm' | 'default'
  createLabel?: string
  continueLabel?: string
}

export function ApplyOrContinueButton({
  intakeId,
  offeringId,
  className,
  size = 'default',
  createLabel = 'Create Application',
  continueLabel = 'Continue Application',
}: Props) {
  const { isAuthenticated, user } = useAuth()
  const active =
    isAuthenticated && user ? getActiveApplication(user.email) : null

  const createTo = offeringId
    ? `/apply/${intakeId}?offeringId=${encodeURIComponent(offeringId)}`
    : `/apply/${intakeId}`

  const to = active ? applicationPath(active.applicantId, offeringId) : createTo
  const label = active ? continueLabel : createLabel

  return (
    <Link
      to={to}
      className={cn(
        'inline-flex items-center justify-center rounded-lg bg-[#0c3cff] font-medium text-white hover:bg-[#0934dc]',
        size === 'sm' ? 'h-9 px-3 text-sm' : 'h-11 px-5 text-sm',
        className,
      )}
    >
      {label}
    </Link>
  )
}
