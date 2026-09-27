import { useEffect, useMemo, useState } from 'react'
import { BookOpen, Check, Clock, GraduationCap, Info, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ApiError } from '@/lib/api/client'
import { listApplicantProgrammes } from '@/lib/api/admissions'
import { getProgrammeStep, saveProgrammeStep } from '@/lib/api/applications'
import type {
  ApplicantIntake,
  ApplicantOffering,
  QualificationLevel,
} from '@/lib/api/types'
import {
  campusImageForId,
  degreeLevelLabel,
  formatIntakeDate,
  getIntakeWindowStatus,
} from '@/lib/admissions-display'
import {
  qualificationLevelFromDegree,
  qualificationLevelLabel,
} from '@/lib/application-steps'
import { cn } from '@/lib/utils'

type Props = {
  applicantId: string
  intake: ApplicantIntake
  preferredOfferingId?: string | null
  onSaved: (primaryOffering: ApplicantOffering | null) => void
  onPrimaryOfferingChange?: (offering: ApplicantOffering | null) => void
  onBack?: () => void
}

const LEVELS: QualificationLevel[] = ['UNDERGRADUATE', 'POSTGRADUATE', 'PHD']

export function ProgrammeStep({
  applicantId,
  intake,
  preferredOfferingId,
  onSaved,
  onPrimaryOfferingChange,
  onBack,
}: Props) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [offerings, setOfferings] = useState<ApplicantOffering[]>([])
  const [alreadySaved, setAlreadySaved] = useState(false)
  const [level, setLevel] = useState<QualificationLevel>('UNDERGRADUATE')
  const [pref1, setPref1] = useState<string | null>(null)
  const [pref2, setPref2] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [programmes, existing] = await Promise.all([
          listApplicantProgrammes(intake.id, { limit: 100 }),
          getProgrammeStep(applicantId).catch(() => null),
        ])
        if (cancelled) return
        setOfferings(programmes.items)

        if (existing?.programmeStepSaved && existing.options.length > 0) {
          setAlreadySaved(true)
          if (existing.qualificationLevel) setLevel(existing.qualificationLevel)
          const sorted = [...existing.options].sort((a, b) => a.preferenceOrder - b.preferenceOrder)
          setPref1(sorted[0]?.programmeOfferingId ?? null)
          setPref2(sorted[1]?.programmeOfferingId ?? null)
        } else if (preferredOfferingId) {
          const match = programmes.items.find(item => item.id === preferredOfferingId)
          if (match) {
            setPref1(match.id)
            setLevel(qualificationLevelFromDegree(match.programme.degreeLevel))
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Unable to load programmes.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [applicantId, intake.id, preferredOfferingId])

  const filtered = useMemo(() => {
    const byLevel = offerings.filter(
      item => qualificationLevelFromDegree(item.programme.degreeLevel) === level,
    )
    const q = search.trim().toLowerCase()
    if (!q) return byLevel
    return byLevel.filter(item => {
      const hay = `${item.programme.name} ${item.programme.code} ${item.programme.programmeGrouping ?? ''}`.toLowerCase()
      return hay.includes(q)
    })
  }, [offerings, level, search])

  const selected1 = offerings.find(item => item.id === pref1) ?? null
  const selected2 = offerings.find(item => item.id === pref2) ?? null
  const windowStatus = getIntakeWindowStatus(intake.applicationOpenAt, intake.applicationCloseAt)

  useEffect(() => {
    onPrimaryOfferingChange?.(selected1)
  }, [selected1, onPrimaryOfferingChange])

  async function handleSave() {
    if (!pref1) {
      setError('Select your first preferred programme.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const options = [
        { programmeOfferingId: pref1, preferenceOrder: 1 },
        ...(pref2 ? [{ programmeOfferingId: pref2, preferenceOrder: 2 }] : []),
      ]
      await saveProgrammeStep(applicantId, { qualificationLevel: level, options }, alreadySaved)
      setAlreadySaved(true)
      onSaved(selected1)
    } catch (err: unknown) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Unable to save programme selection.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-[#6374ab]">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading programmes...
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-[#071759]">Programme Selection</h2>
        <p className="mt-1 text-sm text-[#354a8d]">
          Select your preferred programme(s) for this intake. Preference 1 is required.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[#d6e4ff] bg-[#eef4ff] px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-[#071759]">{intake.intakeName}</p>
          <p className="text-xs text-[#354a8d]">
            Application Period: {formatIntakeDate(intake.applicationOpenAt)} –{' '}
            {formatIntakeDate(intake.applicationCloseAt)}
          </p>
        </div>
        <span
          className={cn(
            'rounded-full px-2.5 py-1 text-[11px] font-semibold',
            windowStatus === 'open' ? 'bg-[#dcfce7] text-[#15803d]' : 'bg-[#fee2e2] text-[#b91c1c]',
          )}
        >
          {windowStatus === 'open' ? 'Applications Open' : 'Closed'}
        </span>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-[#334155]">
          Qualification Level <span className="text-red-500">*</span>
        </label>
        <select
          value={level}
          onChange={e => {
            setLevel(e.target.value as QualificationLevel)
            setPref1(null)
            setPref2(null)
          }}
          className="h-11 w-full rounded-lg border border-[#dce5f6] bg-white px-3 text-sm text-[#071759]"
        >
          {LEVELS.map(item => (
            <option key={item} value={item}>
              {qualificationLevelLabel(item)}
            </option>
          ))}
        </select>
      </div>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-[#071759]">
            Programme Preference 1 <span className="text-red-500">*</span>
          </h3>
          <p className="text-xs text-[#6374ab]">Select your first preferred programme.</p>
        </div>

        {selected1 ? (
          <ProgrammeCard
            offering={selected1}
            selected
            onSelect={() => undefined}
          />
        ) : null}

        <ProgrammePicker
          offerings={filtered.filter(item => item.id !== pref2)}
          selectedId={pref1}
          search={search}
          onSearchChange={setSearch}
          onSelect={id => setPref1(id)}
        />
      </section>

      <section className="space-y-3">
        <div>
          <h3 className="text-sm font-semibold text-[#071759]">Programme Preference 2 (Optional)</h3>
          <p className="text-xs text-[#6374ab]">
            You may select a second preference (maximum 2 programmes).{' '}
            {(pref1 ? 1 : 0) + (pref2 ? 1 : 0)}/2 selected
          </p>
        </div>

        {selected2 ? (
          <ProgrammeCard
            offering={selected2}
            selected
            onSelect={() => setPref2(null)}
            clearable
          />
        ) : (
          <ProgrammePicker
            offerings={filtered.filter(item => item.id !== pref1)}
            selectedId={pref2}
            search=""
            onSearchChange={() => undefined}
            onSelect={id => setPref2(id)}
            compact
          />
        )}
      </section>

      <div className="flex items-start gap-2 rounded-lg border border-[#d6e4ff] bg-[#f5f8ff] px-3 py-2.5 text-xs text-[#354a8d]">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#0c3cff]" />
        Programme availability will be validated against the published intake offering before saving
        your application.
      </div>

      {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {onBack ? (
          <Button type="button" variant="outline" className="h-11 border-[#dce5f6]" onClick={onBack}>
            Previous
          </Button>
        ) : (
          <span />
        )}
        <Button
          type="button"
          disabled={saving}
          onClick={() => void handleSave()}
          className="h-11 bg-[#0c3cff] px-5 hover:bg-[#0934dc]"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save & Continue'
          )}
        </Button>
      </div>
    </div>
  )
}

function ProgrammePicker({
  offerings,
  selectedId,
  search,
  onSearchChange,
  onSelect,
  compact,
}: {
  offerings: ApplicantOffering[]
  selectedId: string | null
  search: string
  onSearchChange: (value: string) => void
  onSelect: (id: string) => void
  compact?: boolean
}) {
  return (
    <div className="space-y-3">
      {!compact ? (
        <div className="flex h-11 items-center gap-2 rounded-lg border border-[#dce5f6] bg-white px-3">
          <Search className="h-4 w-4 text-[#94a3b8]" />
          <Input
            value={search}
            onChange={e => onSearchChange(e.target.value)}
            placeholder="Search and select a programme"
            className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
          />
        </div>
      ) : null}
      <div className={cn('grid gap-3', compact ? 'max-h-64 overflow-y-auto' : '')}>
        {offerings.length === 0 ? (
          <p className="rounded-lg border border-dashed border-[#dce5f6] px-4 py-6 text-center text-sm text-[#6374ab]">
            No programmes found for this qualification level.
          </p>
        ) : (
          offerings.map(offering => (
            <ProgrammeCard
              key={offering.id}
              offering={offering}
              selected={selectedId === offering.id}
              onSelect={() => onSelect(offering.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function ProgrammeCard({
  offering,
  selected,
  onSelect,
  clearable,
}: {
  offering: ApplicantOffering
  selected?: boolean
  onSelect: () => void
  clearable?: boolean
}) {
  const image = campusImageForId(offering.id)
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'w-full rounded-xl border bg-white p-4 text-left transition',
        selected ? 'border-[#0c3cff] ring-2 ring-[#dbe7ff]' : 'border-[#e4e9f4] hover:border-[#b8c6ed]',
      )}
    >
      <div className="flex gap-3">
        <div
          className="h-20 w-24 shrink-0 rounded-lg bg-cover bg-center"
          style={{ backgroundImage: `url('${image}')` }}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-[#071759]">{offering.programme.name}</p>
              <p className="text-xs text-[#6374ab]">
                {offering.programme.programmeGrouping || offering.programme.code}
              </p>
            </div>
            {selected ? (
              <span className="grid h-6 w-6 place-items-center rounded-full bg-[#0c3cff] text-white">
                <Check className="h-3.5 w-3.5" />
              </span>
            ) : null}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-[#6374ab]">
            <span className="inline-flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5" />
              {degreeLevelLabel(offering.programme.degreeLevel)}
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              Full Time
            </span>
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5" />
              {offering.programme.code}
            </span>
          </div>
          {offering.publishedDescription ? (
            <p className="mt-2 line-clamp-2 text-xs text-[#354a8d]">{offering.publishedDescription}</p>
          ) : null}
          {clearable ? (
            <p className="mt-2 text-xs font-medium text-[#0c3cff]">Click to clear selection</p>
          ) : null}
        </div>
      </div>
    </button>
  )
}
