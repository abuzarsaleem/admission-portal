import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { AdmissionsHero } from '@/components/admissions/AdmissionsHero'
import { IntakeCard } from '@/components/admissions/IntakeCard'
import { Skeleton } from '@/components/ui/skeleton'
import { listApplicantIntakes, listApplicantProgrammes } from '@/lib/api/admissions'
import type { ApplicantIntake } from '@/lib/api/types'

export function AdmissionsPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intakes, setIntakes] = useState<ApplicantIntake[]>([])
  const [programmeCounts, setProgrammeCounts] = useState<Record<string, number>>({})
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await listApplicantIntakes({ page: 1, limit: 50 })
        if (cancelled) return
        setIntakes(data.items)

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

  const sorted = useMemo(() => {
    const rank = (openAt: string, closeAt: string) => {
      const now = Date.now()
      const open = new Date(openAt).getTime()
      const close = new Date(closeAt).getTime()
      if (now >= open && now <= close) return 0
      if (now < open) return 1
      return 2
    }
    return [...intakes].sort((a, b) => {
      const diff =
        rank(a.applicationOpenAt, a.applicationCloseAt) -
        rank(b.applicationOpenAt, b.applicationCloseAt)
      if (diff !== 0) return diff
      return new Date(b.applicationOpenAt).getTime() - new Date(a.applicationOpenAt).getTime()
    })
  }, [intakes])

  const visible = showAll ? sorted : sorted.slice(0, 3)

  return (
    <div className="bg-white">
      <AdmissionsHero />

      <section id="intakes" className="scroll-mt-24 bg-white py-12 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
            <div className="max-w-2xl">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-[#8b9bb8]">APPLY NOW</p>
              <h2 className="mt-2 text-2xl font-bold text-[#071759] sm:text-[1.75rem]">
                Available Admissions Intakes
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-[#5b6b94]">
                Browse currently open admissions intakes and explore the programmes available.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setShowAll(prev => !prev)}
              className="mt-1 inline-flex items-center gap-1.5 text-sm font-semibold text-[#0c3cff] hover:underline"
            >
              {showAll ? 'Show less' : 'View all intakes'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          <div id="programmes" className="space-y-4 scroll-mt-24">
            {loading ? (
              <>
                <Skeleton className="h-52 w-full rounded-xl" />
                <Skeleton className="h-52 w-full rounded-xl" />
                <Skeleton className="h-52 w-full rounded-xl" />
              </>
            ) : error ? (
              <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-6 text-center text-sm text-red-700">
                {error}
              </p>
            ) : sorted.length === 0 ? (
              <p className="rounded-xl border border-dashed border-[#dce5f6] bg-[#f8faff] px-4 py-12 text-center text-sm text-[#6374ab]">
                No published intakes are available right now.
              </p>
            ) : (
              visible.map(intake => (
                <IntakeCard
                  key={intake.id}
                  intake={intake}
                  programmesCount={programmeCounts[intake.id] ?? null}
                  onSelect={() => navigate(`/intakes/${intake.id}`)}
                />
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
