import { useEffect, useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { AdmissionsHero } from '@/components/admissions/AdmissionsHero'
import { IntakeCard } from '@/components/admissions/IntakeCard'
import { IntakeDetailPanel } from '@/components/admissions/IntakeDetailPanel'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { listApplicantIntakes, listApplicantProgrammes } from '@/lib/api/admissions'
import type { ApplicantIntake } from '@/lib/api/types'
import { academicYearFromDate } from '@/lib/admissions-display'

export function AdmissionsPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intakes, setIntakes] = useState<ApplicantIntake[]>([])
  const [programmeCounts, setProgrammeCounts] = useState<Record<string, number>>({})
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [yearFilter, setYearFilter] = useState('all')

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await listApplicantIntakes({ page: 1, limit: 50 })
        if (cancelled) return
        setIntakes(data.items)
        setSelectedId(current => current ?? data.items[0]?.id ?? null)

        const counts = await Promise.all(
          data.items.map(async intake => {
            try {
              const programmes = await listApplicantProgrammes(intake.id, { page: 1, limit: 1 })
              return [intake.id, programmes.meta.total] as const
            } catch {
              return [intake.id, 0] as const
            }
          }),
        )
        if (cancelled) return
        setProgrammeCounts(Object.fromEntries(counts))
      } catch (err: unknown) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Unable to load intakes.')
        setIntakes([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const years = useMemo(() => {
    const values = new Set(intakes.map(item => academicYearFromDate(item.applicationOpenAt)))
    return Array.from(values).sort()
  }, [intakes])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return intakes.filter(intake => {
      const year = academicYearFromDate(intake.applicationOpenAt)
      if (yearFilter !== 'all' && year !== yearFilter) return false
      if (!q) return true
      return (
        intake.intakeName.toLowerCase().includes(q) ||
        intake.intakeCode.toLowerCase().includes(q)
      )
    })
  }, [intakes, query, yearFilter])

  useEffect(() => {
    if (filtered.length === 0) {
      setSelectedId(null)
      return
    }
    if (!selectedId || !filtered.some(item => item.id === selectedId)) {
      setSelectedId(filtered[0].id)
    }
  }, [filtered, selectedId])

  return (
    <div>
      <AdmissionsHero />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
          <aside className="space-y-4">
            <div>
              <h2 className="text-lg font-bold text-[#071759]">Available Intakes</h2>
              <p className="mt-1 text-sm text-[#6374ab]">
                Browse published intakes that are currently visible to applicants.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex h-10 items-center gap-2 rounded-lg border border-[#e2e8f0] bg-white px-3">
                <Search className="h-4 w-4 shrink-0 text-[#94a3b8]" />
                <Input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Search intakes..."
                  className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                />
              </div>
              <div className="flex gap-2">
                <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-medium text-[#6374ab]">
                  Academic Year
                  <select
                    value={yearFilter}
                    onChange={event => setYearFilter(event.target.value)}
                    className="h-9 rounded-lg border border-[#e2e8f0] bg-white px-2.5 text-sm text-[#19316f] outline-none focus:border-[#0c3cff]"
                  >
                    <option value="all">All</option>
                    {years.map(year => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            <div className="space-y-3">
              {loading ? (
                <>
                  <Skeleton className="h-36 w-full rounded-xl" />
                  <Skeleton className="h-36 w-full rounded-xl" />
                </>
              ) : error ? (
                <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
                  {error}
                </p>
              ) : filtered.length === 0 ? (
                <p className="rounded-xl border border-dashed border-[#dce5f6] bg-white px-4 py-10 text-center text-sm text-[#6374ab]">
                  No published intakes match your filters.
                </p>
              ) : (
                filtered.map(intake => (
                  <IntakeCard
                    key={intake.id}
                    intake={intake}
                    programmesCount={programmeCounts[intake.id] ?? null}
                    selected={intake.id === selectedId}
                    onSelect={() => setSelectedId(intake.id)}
                  />
                ))
              )}
            </div>
          </aside>

          <section>
            <IntakeDetailPanel intakeId={selectedId} />
          </section>
        </div>
      </div>
    </div>
  )
}
