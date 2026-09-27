import { CalendarDays, Check, Headphones, HelpCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { APPLICATION_STEPS } from '@/lib/application-steps'
import {
  campusImageForId,
  degreeLevelLabel,
  formatIntakeDate,
  getIntakeWindowStatus,
} from '@/lib/admissions-display'
import type { ApplicantIntake, ApplicantOffering, ApplicationStepId } from '@/lib/api/types'
import { cn } from '@/lib/utils'

type Props = {
  intake: ApplicantIntake
  primaryOffering: ApplicantOffering | null
  currentStep: ApplicationStepId
  completed: Partial<Record<ApplicationStepId, boolean>>
  onEditStep?: (step: ApplicationStepId) => void
}

export function ApplicationSidebar({
  intake,
  primaryOffering,
  currentStep,
  completed,
  onEditStep,
}: Props) {
  const windowStatus = getIntakeWindowStatus(intake.applicationOpenAt, intake.applicationCloseAt)
  const image = campusImageForId(primaryOffering?.id ?? intake.id)

  return (
    <aside className="space-y-4 lg:sticky lg:top-24">
      <div className="overflow-hidden rounded-xl border border-[#e4e9f4] bg-white">
        {primaryOffering ? (
          <div className="flex gap-3 border-b border-[#e8edf5] p-4">
            <div
              className="h-16 w-16 shrink-0 rounded-lg bg-cover bg-center"
              style={{ backgroundImage: `url('${image}')` }}
            />
            <div className="min-w-0">
              <p className="text-xs font-medium text-[#6374ab]">
                {primaryOffering.programme.programmeGrouping || 'Programme'}
              </p>
              <h3 className="truncate text-sm font-bold text-[#071759]">
                {primaryOffering.programme.name}
              </h3>
              <p className="mt-1 text-xs text-[#6374ab]">
                {degreeLevelLabel(primaryOffering.programme.degreeLevel)}
              </p>
            </div>
          </div>
        ) : (
          <div className="border-b border-[#e8edf5] p-4">
            <h3 className="text-sm font-bold text-[#071759]">Application Summary</h3>
            <p className="mt-1 text-xs text-[#6374ab]">Select a programme to see a summary here.</p>
          </div>
        )}

        <div className="space-y-1 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#6374ab]">
            Application Progress
          </p>
          <ol className="space-y-3">
            {APPLICATION_STEPS.map(step => {
              const isCurrent = step.id === currentStep
              const isComplete = !!completed[step.id]
              return (
                <li key={step.id} className="flex items-start gap-3">
                  <span
                    className={cn(
                      'mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-semibold',
                      isComplete && 'bg-[#16a34a] text-white',
                      isCurrent && !isComplete && 'bg-[#0c3cff] text-white',
                      !isComplete && !isCurrent && 'bg-[#e8edf5] text-[#6374ab]',
                    )}
                  >
                    {isComplete ? <Check className="h-3.5 w-3.5" /> : step.number}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p
                        className={cn(
                          'text-sm font-semibold',
                          isCurrent ? 'text-[#0c3cff]' : 'text-[#071759]',
                        )}
                      >
                        {step.title}
                      </p>
                      {isComplete && onEditStep ? (
                        <button
                          type="button"
                          onClick={() => onEditStep(step.id)}
                          className="text-xs font-medium text-[#0c3cff] hover:underline"
                        >
                          Edit
                        </button>
                      ) : null}
                    </div>
                    <p className="text-[11px] text-[#94a3b8]">
                      {isComplete ? 'Completed' : isCurrent ? 'In Progress' : 'Not Started'}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      </div>

      <div className="rounded-xl border border-[#d6e4ff] bg-[#eef4ff] p-4">
        <div className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-5 w-5 text-[#0c3cff]" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-[#071759]">{intake.intakeName}</h3>
              <Badge
                className={cn(
                  'rounded-full border-0 text-[10px]',
                  windowStatus === 'open' && 'bg-[#dcfce7] text-[#15803d]',
                  windowStatus === 'upcoming' && 'bg-[#fef3c7] text-[#b45309]',
                  windowStatus === 'closed' && 'bg-[#fee2e2] text-[#b91c1c]',
                )}
              >
                {windowStatus === 'open'
                  ? 'Applications Open'
                  : windowStatus === 'upcoming'
                    ? 'Upcoming'
                    : 'Closed'}
              </Badge>
            </div>
            <p className="mt-1 text-xs text-[#354a8d]">
              {formatIntakeDate(intake.applicationOpenAt)} –{' '}
              {formatIntakeDate(intake.applicationCloseAt)}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-[#e4e9f4] bg-white p-4">
        <div className="flex items-center gap-2">
          <HelpCircle className="h-5 w-5 text-[#0c3cff]" />
          <h3 className="font-semibold text-[#071759]">Need Help?</h3>
        </div>
        <p className="mt-2 text-sm text-[#354a8d]">
          If you have any questions about the application process, feel free to reach out to our
          admissions team.
        </p>
        <button
          type="button"
          className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#0c3cff] bg-white text-sm font-medium text-[#0c3cff]"
        >
          <Headphones className="h-4 w-4" />
          Contact Admissions
        </button>
      </div>
    </aside>
  )
}
