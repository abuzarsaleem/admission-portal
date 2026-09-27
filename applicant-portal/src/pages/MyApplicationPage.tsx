import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ArrowRight, FileText, Plus } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/context/AuthContext'
import { getApplicantIntake } from '@/lib/api/admissions'
import {
  applicationPath,
  getActiveApplication,
  type ApplicationBinding,
} from '@/lib/application-session'
import { formatIntakeDate } from '@/lib/admissions-display'

type ApplicationRow = ApplicationBinding & {
  intakeName?: string
}

export function MyApplicationPage() {
  const { isAuthenticated, user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [row, setRow] = useState<ApplicationRow | null>(null)

  useEffect(() => {
    if (!isAuthenticated || !user) return
    const email = user.email
    const knownApplicantId = user.applicantId
    let cancelled = false

    async function load() {
      setLoading(true)
      let active = getActiveApplication(email)
      if (!active && knownApplicantId) {
        active = {
          applicantId: knownApplicantId,
          applicationReference: knownApplicantId,
          intakeSessionId: '',
          email,
          updatedAt: new Date().toISOString(),
        }
      }

      if (!active) {
        if (!cancelled) {
          setRow(null)
          setLoading(false)
        }
        return
      }

      let enriched: ApplicationRow = active
      if (active.intakeSessionId) {
        try {
          const intake = await getApplicantIntake(active.intakeSessionId)
          enriched = { ...active, intakeName: intake.intakeName }
        } catch {
          enriched = active
        }
      }

      if (!cancelled) {
        setRow(enriched)
        setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user])

  if (!isAuthenticated || !user) {
    return <Navigate to="/sign-in" replace state={{ from: '/my-application' }} />
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.16em] text-[#0c3cff]">MY APPLICATION</p>
          <h1 className="mt-2 text-2xl font-bold text-[#071759] sm:text-3xl">My Application</h1>
          <p className="mt-2 text-sm text-[#354a8d]">
            You can have one active application at a time. Continue it here, or create one if you
            don&apos;t have any yet.
          </p>
        </div>
        {!loading && !row ? (
          <Link
            to="/#intakes"
            className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-[#0c3cff] px-4 text-sm font-medium text-white hover:bg-[#0934dc]"
          >
            <Plus className="h-4 w-4" />
            Create Application
          </Link>
        ) : null}
      </div>

      <div className="mt-8">
        {loading ? (
          <Skeleton className="h-28 w-full rounded-xl" />
        ) : !row ? (
          <div className="rounded-xl border border-dashed border-[#dce5f6] bg-white px-6 py-14 text-center">
            <FileText className="mx-auto h-10 w-10 text-[#94a3b8]" />
            <h2 className="mt-4 text-lg font-semibold text-[#071759]">No application yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#6374ab]">
              You don&apos;t have an application yet. Choose an intake and create one to get
              started.
            </p>
            <Link
              to="/#intakes"
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-lg bg-[#0c3cff] px-5 text-sm font-medium text-white hover:bg-[#0934dc]"
            >
              Browse intakes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="rounded-xl border border-[#e4e9f4] bg-white px-5 py-5">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold text-[#071759]">
                  {row.intakeName || 'Admission application'}
                </p>
                <p className="mt-1 text-xs text-[#6374ab]">
                  Ref: {row.applicationReference}
                  {row.updatedAt ? ` · Updated ${formatIntakeDate(row.updatedAt)}` : null}
                </p>
                <p className="mt-2 text-xs text-[#94a3b8]">
                  Only one application is allowed at a time. Continue this one to finish or update
                  it.
                </p>
              </div>
              <Link
                to={applicationPath(row.applicantId)}
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#0c3cff] px-4 text-sm font-medium text-white hover:bg-[#0934dc]"
              >
                Continue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
