import type { IntakeStatus } from '@/lib/api/types'
import { intakeStatusLabel } from '@/lib/intake-mappers'
import { PillBadge, pillBadgeStyles } from '@/components/shared/PillBadge'

const intakeStatusStyles: Record<IntakeStatus, (typeof pillBadgeStyles)[keyof typeof pillBadgeStyles]> = {
  DRAFT: pillBadgeStyles.draft,
  CONFIGURED: pillBadgeStyles.configured,
  UNDER_REVIEW: pillBadgeStyles.underReview,
  PUBLISHED: pillBadgeStyles.published,
  CLOSED: pillBadgeStyles.closed,
}

export function IntakeStatusBadge({ status }: { status: IntakeStatus }) {
  return <PillBadge label={intakeStatusLabel(status)} style={intakeStatusStyles[status]} />
}
