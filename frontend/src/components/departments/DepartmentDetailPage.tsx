import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CreateProgrammeDrawer } from '@/components/programmes/CreateProgrammeDrawer'
import { DepartmentDetailSkeleton } from '@/components/shared/LoadingSkeletons'
import { SearchSelect } from '@/components/shared/SearchSelect'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { clickableTableRowClass, stopRowClickPropagation, TableRowActions } from '@/components/shared/TableRowActions'
import { ApiError } from '@/lib/api/client'
import { getDepartment, listDepartments } from '@/lib/api/departments'
import { listProgrammes } from '@/lib/api/programmes'
import type { DepartmentResponse, ProgrammeResponse } from '@/lib/api/types'
import { asText, toUiDegreeLevel, toUiStatus } from '@/lib/catalog-mappers'
import { levelFilterOptions } from '@/data/programmes-data'
import { NotFoundPage } from '@/pages/NotFoundPage'

const PAGE_SIZE = 10

function formatDate(value: string) {
  try {
    return new Date(value).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return value
  }
}

export function DepartmentDetailPage() {
  const { departmentId = '' } = useParams()
  const [department, setDepartment] = useState<DepartmentResponse | null>(null)
  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [programmes, setProgrammes] = useState<ProgrammeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  const [query, setQuery] = useState('')
  const [level, setLevel] = useState('All')
  const [status, setStatus] = useState('All')
  const [page, setPage] = useState(1)

  const [programmeDrawerOpen, setProgrammeDrawerOpen] = useState(false)
  const [editingProgramme, setEditingProgramme] = useState<ProgrammeResponse | null>(null)
  const loadData = useCallback(async () => {
    if (!departmentId) return
    setLoading(true)
    setNotFound(false)
    try {
      const [dept, programmeList, deptList] = await Promise.all([
        getDepartment(departmentId),
        listProgrammes({ page: 1, limit: 100, departmentId }),
        listDepartments({ page: 1, limit: 100 }),
      ])
      setDepartment(dept)
      setProgrammes(programmeList.items)
      setDepartments(deptList.items)
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 404) {
        setNotFound(true)
      } else {
        const message = error instanceof ApiError ? error.message : 'Failed to load department.'
        toast.error(message)
      }
      setDepartment(null)
      setProgrammes([])
    } finally {
      setLoading(false)
    }
  }, [departmentId])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    return programmes.filter(prog => {
      const uiLevel = toUiDegreeLevel(prog.degreeLevel)
      const uiStatus = toUiStatus(prog.status)
      const matchesQuery =
        query === '' || `${prog.name} ${prog.code} ${uiLevel}`.toLowerCase().includes(query.toLowerCase())
      const matchesLevel = level === 'All' || uiLevel === level
      const matchesStatus = status === 'All' || uiStatus === status
      return matchesQuery && matchesLevel && matchesStatus
    })
  }, [programmes, query, level, status])

  if (loading) {
    return <DepartmentDetailSkeleton />
  }

  if (notFound || !department) return <NotFoundPage />

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage * PAGE_SIZE, filtered.length)
  const hasFilters = query !== '' || level !== 'All' || status !== 'All'

  function clearFilters() {
    setQuery('')
    setLevel('All')
    setStatus('All')
    setPage(1)
  }

  function openCreateProgrammeDrawer() {
    setEditingProgramme(null)
    setProgrammeDrawerOpen(true)
  }

  function openEditProgrammeDrawer(programme: ProgrammeResponse) {
    setEditingProgramme(programme)
    setProgrammeDrawerOpen(true)
  }

  function handleProgrammeDrawerOpenChange(open: boolean) {
    if (!open) setEditingProgramme(null)
    setProgrammeDrawerOpen(open)
  }

  return (
    <>
      <p className="mb-4 text-sm text-[#40559e]">
        <Link to="/catalog/departments" className="hover:text-[#0644ff]">
          Departments
        </Link>
        <span className="px-1.5">›</span>
        {department.name}
      </p>

      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight text-[#071759]">{department.name}</h1>
          <StatusBadge status={toUiStatus(department.status)} />
        </div>
        <p className="mt-2 max-w-3xl text-[#43599e]">{asText(department.description) || '—'}</p>
      </div>

      <Card className="mb-5 grid gap-0 overflow-hidden border-[#e1e8f5] py-0 shadow-none sm:grid-cols-2 xl:grid-cols-4">
        <MetaItem label="Department Code" value={department.code} />
        <MetaItem label="Total Programmes" value={String(programmes.length)} bordered />
        <MetaItem
          label="Created On"
          value={formatDate(department.createdAt)}
          subtext={`by ${department.createdBy}`}
          bordered
        />
        <MetaItem
          label="Last Updated"
          value={formatDate(department.updatedAt)}
          subtext={`by ${department.updatedBy}`}
          bordered
        />
      </Card>

      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-[#071759]">Programmes ({programmes.length})</h2>
              <p className="mt-1 text-sm text-[#6374ab]">
                Programmes offered under this department. Add or manage programmes linked to {department.name}.
              </p>
            </div>
            <Button className="h-11 bg-[#0c3cff] px-5 hover:bg-[#0934dc]" onClick={openCreateProgrammeDrawer}>
              <Plus className="mr-2 h-4 w-4" />
              Add Programme
            </Button>
          </div>

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
                  placeholder="Search programmes..."
                />
              </div>
              <div className="w-full sm:w-40">
                <SearchSelect
                  variant="filter"
                  label="Level"
                  value={level}
                  onChange={value => {
                    setLevel(value)
                    setPage(1)
                  }}
                  options={levelFilterOptions}
                  required={false}
                />
              </div>
              <div className="w-full sm:w-40">
                <SearchSelect
                  variant="filter"
                  label="Status"
                  value={status}
                  onChange={value => {
                    setStatus(value)
                    setPage(1)
                  }}
                  options={['All', 'Active', 'Inactive']}
                  required={false}
                />
              </div>
              <button
                type="button"
                onClick={clearFilters}
                disabled={!hasFilters}
                className="mb-2.5 ml-auto text-sm font-medium text-[#0644ff] hover:text-[#0934dc] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Clear Filters
              </button>
            </div>

            <div className="overflow-x-auto py-3">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead className="bg-[#f4f7fc] text-xs font-bold">
                  <tr>
                    <th className="px-4 py-3">#</th>
                    <th className="px-4 py-3">Programme Name</th>
                    <th className="px-4 py-3">Code</th>
                    <th className="px-4 py-3">Level</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-10 text-center text-[#6374ab]">
                        No programmes found.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((prog, index) => (
                      <tr
                        key={prog.id}
                        className={clickableTableRowClass}
                        onClick={() => openEditProgrammeDrawer(prog)}
                        onKeyDown={event => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openEditProgrammeDrawer(prog)
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label={`Open ${prog.name}`}
                      >
                        <td className="px-4 py-3.5 text-[#19316f]">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                        <td className="px-4 py-3.5 font-medium text-[#071759]">{prog.name}</td>
                        <td className="px-4 py-3.5 text-[#19316f]">{prog.code}</td>
                        <td className="px-4 py-3.5 text-[#19316f]">{toUiDegreeLevel(prog.degreeLevel)}</td>
                        <td className="px-4 py-3.5">
                          <StatusBadge status={toUiStatus(prog.status)} />
                        </td>
                        <td className="px-4 py-3.5" onClick={stopRowClickPropagation}>
                          <TableRowActions onEdit={() => openEditProgrammeDrawer(prog)} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#e4e9f4] px-4 py-4 text-sm text-[#354a8d]">
              <span>
                Showing {start} to {end} of {filtered.length} programmes
              </span>
              <div className="flex items-center gap-2">
                <Button
                  size="icon-sm"
                  variant="outline"
                  className="border-[#dce5f6]"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
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
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
      </Card>

      <CreateProgrammeDrawer
        open={programmeDrawerOpen}
        onOpenChange={handleProgrammeDrawerOpenChange}
        onCreated={loadData}
        departments={departments}
        programme={editingProgramme}
        defaultDepartmentName={department.name}
      />

    </>
  )
}

function MetaItem({
  label,
  value,
  subtext,
  bordered = false,
}: {
  label: string
  value: string
  subtext?: string
  bordered?: boolean
}) {
  return (
    <div className={`px-6 py-5 ${bordered ? 'xl:border-l xl:border-[#e4e9f4]' : ''}`}>
      <p className="text-xs font-medium text-[#6374ab]">{label}</p>
      <p className="mt-1 text-lg font-bold text-[#071759]">{value}</p>
      {subtext && <p className="mt-0.5 text-xs text-[#6374ab]">{subtext}</p>}
    </div>
  )
}

