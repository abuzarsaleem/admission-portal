import { ArrowRight, CalendarDays, Layers } from 'lucide-react'
import { ApplicationStatusBadge } from '@/components/admissions/ApplicationStatusBadge'
import type { ApplicantIntake } from '@/lib/api/types'
import {
  campusImageForId,
  formatIntakeDate,
  getIntakeWindowStatus,
  inferIntakeSeason,
} from '@/lib/admissions-display'

type Props = {
  intake: ApplicantIntake
  programmesCount: number | null
  onSelect: () => void
}

export function IntakeCard({ intake, programmesCount, onSelect }: Props) {
  const status = getIntakeWindowStatus(intake.applicationOpenAt, intake.applicationCloseAt)
  const image = campusImageForId(intake.id)
  const season = inferIntakeSeason(intake.intakeName, intake.intakeCode)
  const description =
    status === 'open'
      ? `Applications are now open for the ${season.toLowerCase()} intake. Browse programmes and start your application today.`
      : status === 'upcoming'
        ? `Applications for the ${season.toLowerCase()} intake will open soon. Get notified when the window starts.`
        : `The application window for this ${season.toLowerCase()} intake has closed.`

  return (
    <article className="overflow-hidden rounded-xl border border-[#e4e9f4] bg-white shadow-[0_1px_3px_rgb(15_31_77/0.04)]">
      <div className="flex">
        <div className="flex min-w-0 flex-1 flex-col p-5 sm:p-6">
          <ApplicationStatusBadge status={status} className="w-fit text-[11px]" />

          <h3 className="mt-3 text-lg font-bold text-[#071759] sm:text-xl">{intake.intakeName}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#5b6b94]">{description}</p>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-2.5">
              <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[#0c3cff]" strokeWidth={1.75} />
              <div>
                <p className="text-sm font-semibold text-[#071759]">Application Period</p>
                <p className="mt-0.5 text-sm text-[#6374ab]">
                  {formatIntakeDate(intake.applicationOpenAt)} -{' '}
                  {formatIntakeDate(intake.applicationCloseAt)}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-2.5">
              <Layers className="mt-0.5 h-4 w-4 shrink-0 text-[#0c3cff]" strokeWidth={1.75} />
              <div>
                <p className="text-sm font-semibold text-[#071759]">Programmes</p>
                <p className="mt-0.5 text-sm text-[#6374ab]">
                  {programmesCount == null
                    ? 'Loading…'
                    : `${programmesCount} Programme${programmesCount === 1 ? '' : 's'}`}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6">
            {status === 'open' ? (
              <button
                type="button"
                onClick={onSelect}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-[#0c3cff] px-4 text-sm font-semibold text-white hover:bg-[#0934dc]"
              >
                View Details
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : status === 'upcoming' ? (
              <button
                type="button"
                onClick={onSelect}
                className="inline-flex h-10 items-center rounded-md border border-[#0c3cff] bg-white px-4 text-sm font-semibold text-[#0c3cff] hover:bg-[#f8faff]"
              >
                Notify Me
              </button>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex h-10 cursor-not-allowed items-center rounded-md bg-[#e8eef8] px-4 text-sm font-semibold text-[#94a3b8]"
              >
                View Details
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={status === 'closed' ? undefined : onSelect}
          disabled={status === 'closed'}
          className="relative hidden w-36 shrink-0 self-stretch overflow-hidden sm:block md:w-44"
          aria-label={`Open ${intake.intakeName}`}
        >
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url('${image}')` }}
          />
        </button>
      </div>
    </article>
  )
}
