import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Card } from '@/components/ui/card'
import { ProgrammeReviewSection } from '@/components/intakes/ProgrammeReviewSection'
import { ApiError } from '@/lib/api/client'
import { getIntakeReview } from '@/lib/api/intakes'
import type { IntakeReviewPackage } from '@/lib/api/types'
import { formatDisplayDate, splitIsoToDateTime } from '@/lib/intake-mappers'
import type { IntakeFlowData, IntakeProgrammeOption } from '@/types/intake-flow'

type ReviewSubmitStepProps = {
  data: IntakeFlowData
  programmes: IntakeProgrammeOption[]
  intakeId: string | null
  mode?: 'configure' | 'publication'
  /** Pass when parent already loaded the review package to avoid a duplicate fetch. */
  reviewPackage?: IntakeReviewPackage | null
}

function formatDateTime(date: string, time: string) {
  if (!date) return '—'
  const formattedDate = formatDisplayDate(date)
  return time ? `${formattedDate}, ${time}` : formattedDate
}

export function ReviewSubmitStep({
  data,
  programmes,
  intakeId,
  mode = 'configure',
  reviewPackage = null,
}: ReviewSubmitStepProps) {
  const [review, setReview] = useState<IntakeReviewPackage | null>(reviewPackage)
  const selectedProgrammes = programmes.filter(programme => data.selectedProgrammes.includes(programme.id))

  const criteriaLabels = data.criteriaLabels
  const feeLabels = data.feeLabels

  useEffect(() => {
    if (reviewPackage) {
      setReview(reviewPackage)
      return
    }

    if (!intakeId) return

    let cancelled = false
    async function loadReview() {
      try {
        const reviewResult = await getIntakeReview(intakeId!)
        if (!cancelled) setReview(reviewResult)
      } catch (error) {
        if (cancelled) return
        const message = error instanceof ApiError ? error.message : 'Failed to load review summary.'
        toast.error(message)
      }
    }

    loadReview()
    return () => {
      cancelled = true
    }
  }, [intakeId, reviewPackage])

  const intakeName = data.name || review?.intake.intakeName || '—'
  const intakeCode = data.code || review?.intake.intakeCode || '—'
  const academicYear = data.academicYear || '—'
  const intakeType = data.intakeType || '—'
  const description = data.description.trim()

  const opensAt = data.opensDate
    ? formatDateTime(data.opensDate, data.opensTime)
    : review?.intake.applicationOpenAt
      ? (() => {
          const open = splitIsoToDateTime(review.intake.applicationOpenAt)
          return formatDateTime(open.date, open.time)
        })()
      : '—'

  const closesAt = data.closesDate
    ? formatDateTime(data.closesDate, data.closesTime)
    : review?.intake.applicationCloseAt
      ? (() => {
          const close = splitIsoToDateTime(review.intake.applicationCloseAt)
          return formatDateTime(close.date, close.time)
        })()
      : '—'

  const intakeOverviewRows: [string, string][] = [
    ['Intake Name', intakeName],
    ['Intake Code', intakeCode],
    ['Academic Year', academicYear],
    ['Intake Type', intakeType],
    ['Opens At', opensAt],
    ['Closes At', closesAt],
    ...(description ? [['Description', description] as [string, string]] : []),
  ]

  return (
    <div className="space-y-5">
      {review && !review.readiness.ready && review.readiness.issues.length > 0 && (
        <Card className="border-[#ffd5d5] bg-[#fff5f5] p-4 shadow-none">
          <p className="text-sm font-semibold text-[#b42318]">Publication readiness issues</p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-[#7a271a]">
            {review.readiness.issues.map(issue => (
              <li key={`${issue.code}-${issue.message}`}>{issue.message}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="border-[#e1e8f5] p-6 shadow-none">
        <h2 className="text-lg font-bold text-[#071759]">Intake Overview</h2>
        <p className="mt-1 text-sm text-[#6374ab]">General intake details and application window.</p>
        <dl className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {intakeOverviewRows.map(([label, value]) => (
            <div key={label} className={label === 'Description' ? 'sm:col-span-2 lg:col-span-3' : undefined}>
              <dt className="text-xs font-medium text-[#6374ab]">{label}</dt>
              <dd className="mt-1 text-sm font-medium text-[#071759]">{value}</dd>
            </div>
          ))}
        </dl>
      </Card>

      <ProgrammeReviewSection
        programmes={selectedProgrammes}
        programmeConfigs={data.programmeConfigs}
        programmeOfferings={data.programmeOfferings}
        criteriaLabels={criteriaLabels}
        feeLabels={feeLabels}
        variant="review"
        getCounts={
          review
            ? programmeId => {
                const offering = review.offerings.find(item => item.programmeId === programmeId)
                const config = data.programmeConfigs[programmeId]
                return {
                  criteria: offering?.criteriaCount ?? config?.selectedCriteriaIds.length ?? 0,
                  fees: offering?.activeFeeCount ?? config?.selectedFeeIds.length ?? 0,
                  supporting:
                    offering?.supportingInformationCount ??
                    config?.supportingInfo.filter(item => !item.removed).length ??
                    0,
                }
              }
            : undefined
        }
      />

      {mode === 'configure' && (
        <Card className="border-[#c7d9ff] bg-[#edf3ff] p-4 shadow-none">
          <p className="text-sm text-[#43599e]">
            Review all details above. Click <strong>Submit for Review</strong> to send this intake for approval.
          </p>
        </Card>
      )}
    </div>
  )
}
