import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, ChevronLeft, ChevronRight, ChevronRight as RowChevron, CircleDollarSign, FileText, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { TableRowsSkeleton } from '@/components/shared/LoadingSkeletons'
import { IntakeStatusBadge } from '@/components/shared/IntakeStatusBadge'
import { SearchSelect } from '@/components/shared/SearchSelect'
import { StatCard } from '@/components/shared/StatCard'
import { ApiError } from '@/lib/api/client'
import { getIntakeStats, listIntakes } from '@/lib/api/intakes'
import type { IntakeResponse } from '@/lib/api/types'
import {
  formatApplicationPeriod,
  formatLastUpdated,
  toApiIntakeStatus,
  toUiIntakeStatus,
  type UiIntakeStatus,
} from '@/lib/intake-mappers'

const PAGE_SIZE = 10
const FETCH_LIMIT = 100

const statusFilterOptions = ['All', 'Draft', 'Configured', 'Under Review', 'Published', 'Closed']
const periodFilterOptions = ['All', 'Open', 'Upcoming', 'Closed']
const sortOptions = ['Latest Updated', 'Name A - Z', 'Name Z - A']

function getIntakeRowPath(intakeId: string, uiStatus: UiIntakeStatus) {
  if (uiStatus === 'Under Review' || uiStatus === 'Published' || uiStatus === 'Closed') {
    return `/intakes/${intakeId}/review`
  }
  return `/intakes/${intakeId}/configure/intake-information`
}

export function IntakesListingPage() {
  const navigate = useNavigate()
  const [intakes, setIntakes] = useState<IntakeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState<UiIntakeStatus | 'All'>('All')
  const [period, setPeriod] = useState('All')
  const [sortBy, setSortBy] = useState('Latest Updated')
  const [page, setPage] = useState(1)
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    underReview: 0,
    published: 0,
    closed: 0,
  })
  const loadStats = useCallback(async () => {
    try {
      const summary = await getIntakeStats()
      setStats({
        total: summary.total,
        draft: summary.draft + summary.configured,
        underReview: summary.underReview,
        published: summary.published,
        closed: summary.closed,
      })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load intake stats.'
      toast.error(message)
    }
  }, [])

  const loadIntakes = useCallback(async () => {
    setLoading(true)
    try {
      const listResult = await listIntakes({
        page: 1,
        limit: FETCH_LIMIT,
        status: toApiIntakeStatus(status),
      })
      setIntakes(listResult.items)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load intakes.'
      toast.error(message)
      setIntakes([])
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadIntakes()
  }, [loadIntakes])

  const filtered = useMemo(() => {
    let result = intakes.filter(intake => {
      const uiStatus = toUiIntakeStatus(intake.status)
      const matchesQuery =
        query === '' ||
        `${intake.intakeName} ${intake.intakeCode}`.toLowerCase().includes(query.toLowerCase())
      const matchesStatus = status === 'All' || uiStatus === status
      const matchesPeriod =
        period === 'All' ||
        (period === 'Closed' && uiStatus === 'Closed') ||
        (period === 'Open' && uiStatus === 'Published') ||
        (period === 'Upcoming' &&
          (uiStatus === 'Draft' || uiStatus === 'Configured' || uiStatus === 'Under Review'))
      return matchesQuery && matchesStatus && matchesPeriod
    })

    if (sortBy === 'Name A - Z') result = [...result].sort((a, b) => a.intakeName.localeCompare(b.intakeName))
    if (sortBy === 'Name Z - A') result = [...result].sort((a, b) => b.intakeName.localeCompare(a.intakeName))
    if (sortBy === 'Latest Updated') {
      result = [...result].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
    }

    return result
  }, [intakes, query, status, period, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage * PAGE_SIZE, filtered.length)
  const hasFilters = query !== '' || status !== 'All' || period !== 'All' || sortBy !== 'Latest Updated'

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-sm text-[#40559e]">
            Admissions <span className="px-1">›</span> Intakes
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#071759]">Admissions Intakes</h1>
          <p className="mt-1 text-[#43599e]">
            Manage admission cycles, programme offerings, application periods, and publication.
          </p>
        </div>
        <Link to="/intakes/create/intake-information">
          <Button className="mt-7 h-11 bg-[#0c3cff] px-5 hover:bg-[#0934dc]">
            <Plus className="mr-2 h-4 w-4" />
            Create Intake
          </Button>
        </Link>
      </div>

      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard value={stats.total} label="Total Intakes" icon={FileText} />
        <StatCard value={stats.draft} label="Draft" icon={CircleDollarSign} iconBg="bg-[#e9eef7] text-[#31518d]" />
        <StatCard value={stats.underReview} label="Under Review" icon={CircleDollarSign} iconBg="bg-[#fef3c7] text-[#b45309]" />
        <StatCard value={stats.published} label="Published" icon={Check} iconBg="bg-[#e0f9ed] text-[#00a768]" />
        <StatCard value={stats.closed} label="Closed" dotColor="bg-[#31518d]" dotBg="bg-[#e9eef7]" />
      </section>

      <Card className="gap-0 overflow-hidden border-[#e1e8f5] py-0 shadow-none">
        <div className="flex flex-wrap items-end gap-4 border-b border-[#e4e9f4] p-4">
          <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md bg-[#f1f5fb] px-3 sm:max-w-95">
            <Search className="h-4 w-4 shrink-0 text-[#6374ab]" />
            <Input
              className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              value={query}
              onChange={event => {
                setQuery(event.target.value)
                setPage(1)
              }}
              placeholder="Search intakes by name or code..."
            />
          </div>
          <div className="w-full sm:w-40">
            <SearchSelect
              variant="filter"
              label="Status"
              value={status}
              onChange={value => {
                setStatus(value as UiIntakeStatus | 'All')
                setPage(1)
              }}
              options={statusFilterOptions}
              required={false}
            />
          </div>
          <div className="w-full sm:w-44">
            <SearchSelect
              variant="filter"
              label="Application Period"
              value={period}
              onChange={value => {
                setPeriod(value)
                setPage(1)
              }}
              options={periodFilterOptions}
              required={false}
            />
          </div>
          <div className="w-full sm:w-44">
            <SearchSelect
              variant="filter"
              label="Sort by"
              value={sortBy}
              onChange={setSortBy}
              options={sortOptions}
              required={false}
            />
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setStatus('All')
                setPeriod('All')
                setSortBy('Latest Updated')
                setPage(1)
              }}
              className="mb-2.5 ml-auto text-sm font-medium text-[#0644ff] hover:text-[#0934dc]"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="overflow-x-auto py-3">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-[#f4f7fc] text-xs font-bold">
              <tr>
                <th className="px-4 py-3">Intake Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Application Period</th>
                <th className="px-4 py-3">Programmes</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Last Updated</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowsSkeleton columns={7} />
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[#6374ab]">
                    No intakes found.
                  </td>
                </tr>
              ) : (
                paginated.map(intake => {
                  const uiStatus = toUiIntakeStatus(intake.status)
                  const rowPath = getIntakeRowPath(intake.id, uiStatus)

                  function openIntake() {
                    navigate(rowPath)
                  }

                  return (
                    <tr
                      key={intake.id}
                      className="cursor-pointer transition-colors hover:bg-[#f4f7fc]"
                      onClick={openIntake}
                      onKeyDown={event => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault()
                          openIntake()
                        }
                      }}
                      tabIndex={0}
                      role="link"
                      aria-label={`Open ${intake.intakeName}`}
                    >
                      <td className="px-4 py-3.5 font-medium text-[#071759]">{intake.intakeName}</td>
                      <td className="px-4 py-3.5 text-[#19316f]">{intake.intakeCode}</td>
                      <td className="px-4 py-3.5 text-[#354a8d]">
                        {formatApplicationPeriod(intake.applicationOpenAt, intake.applicationCloseAt)}
                      </td>
                      <td className="px-4 py-3.5 text-[#19316f]">{intake.programmesCount}</td>
                      <td className="px-4 py-3.5">
                        <IntakeStatusBadge status={intake.status} />
                      </td>
                      <td className="px-4 py-3.5 text-[#19316f]">{formatLastUpdated(intake.updatedAt)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          {uiStatus === 'Under Review' && (
                            <Button
                              size="sm"
                              className="h-8 w-20 px-3 text-xs"
                              onClick={event => {
                                event.stopPropagation()
                                navigate(`/intakes/${intake.id}/review`)
                              }}
                            >
                              Review
                            </Button>
                          )}
                          <button
                            type="button"
                            className="inline-flex text-[#6374ab]"
                            onClick={openIntake}
                            aria-label={`Open ${intake.intakeName}`}
                          >
                            <RowChevron className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e4e9f4] px-4 py-4 text-sm text-[#354a8d]">
          <span>
            Showing {start}–{end} of {filtered.length} intakes
          </span>
          <div className="flex items-center gap-2">
            <Button
              size="icon-sm"
              variant="outline"
              className="border-[#dce5f6]"
              disabled={currentPage <= 1}
              onClick={() => setPage(current => current - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: totalPages }, (_, index) => index + 1).map(pageNum => (
              <Button
                key={pageNum}
                size="sm"
                variant={pageNum === currentPage ? 'default' : 'outline'}
                className={
                  pageNum === currentPage
                    ? 'min-w-8 bg-[#e3edff] text-[#0644ff] hover:bg-[#dbe7ff]'
                    : 'min-w-8 border-[#dce5f6] text-[#354a8d]'
                }
                onClick={() => setPage(pageNum)}
              >
                {pageNum}
              </Button>
            ))}
            <Button
              size="icon-sm"
              variant="outline"
              className="border-[#dce5f6]"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(current => current + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>

    </>
  )
}
