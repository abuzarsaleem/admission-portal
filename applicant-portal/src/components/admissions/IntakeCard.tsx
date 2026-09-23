import { CalendarDays, ChevronRight, Layers } from 'lucide-react'
import { ApplicationStatusBadge } from '@/components/admissions/ApplicationStatusBadge'
import type { ApplicantIntake } from '@/lib/api/types'
import {
  academicYearFromDate,
  formatIntakeDate,
  getIntakeWindowStatus,
} from '@/lib/admissions-display'
import { cn } from '@/lib/utils'

type Props = {
  intake: ApplicantIntake
  programmesCount: number | null
  selected: boolean
  onSelect: () => void
}

export function IntakeCard({ intake, programmesCount, selected, onSelect }: Props) {
  const status = getIntakeWindowStatus(intake.applicationOpenAt, intake.applicationCloseAt)
  const year = academicYearFromDate(intake.applicationOpenAt)

  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-xl border bg-white p-4 text-left transition-all',
        selected
          ? 'border-[#0c3cff] shadow-[0_0_0_1px_#0c3cff]'
          : 'border-[#e4e9f4] hover:border-[#b8c6ed]',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[#edf3ff] text-[#0c3cff]">
          <CalendarDays className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-[#071759]">{intake.intakeName}</h3>
            <ApplicationStatusBadge status={status} />
          </div>
          <p className="mt-1 text-xs font-medium tracking-wide text-[#6374ab]">
            {intake.intakeCode} · {year}
          </p>
          <p className="mt-2 line-clamp-2 text-sm text-[#354a8d]">
            Published intake open for browsing. Review programmes and key dates before applying.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#6374ab]">
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatIntakeDate(intake.applicationOpenAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5" />
              {formatIntakeDate(intake.applicationCloseAt)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5" />
              {programmesCount == null ? '…' : `${programmesCount} Programme${programmesCount === 1 ? '' : 's'}`}
            </span>
          </div>
        </div>
        <ChevronRight className={cn('mt-2 h-5 w-5 shrink-0', selected ? 'text-[#0c3cff]' : 'text-[#94a3b8]')} />
      </div>
    </button>
  )
}
