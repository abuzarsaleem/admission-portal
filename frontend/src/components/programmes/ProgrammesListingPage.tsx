import { useCallback, useEffect, useMemo, useState } from 'react'
import { Building2, ChevronLeft, ChevronRight, GraduationCap, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CreateProgrammeDrawer } from '@/components/programmes/CreateProgrammeDrawer'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TableRowsSkeleton } from '@/components/shared/LoadingSkeletons'
import { ApiError } from '@/lib/api/client'
import { listDepartments } from '@/lib/api/departments'
import { countProgrammes, deactivateProgramme, listProgrammes } from '@/lib/api/programmes'
import type { DepartmentResponse, ProgrammeResponse } from '@/lib/api/types'
import { asText, toApiStatus, toUiDegreeLevel, toUiStatus } from '@/lib/catalog-mappers'
import { SearchSelect } from '@/components/shared/SearchSelect'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { clickableTableRowClass, stopRowClickPropagation, TableRowActions } from '@/components/shared/TableRowActions'
import { levelFilterOptions, statusFilterOptions } from '@/data/programmes-data'

const PAGE_SIZE = 10
const FETCH_LIMIT = 100

type ProgrammeRow = ProgrammeResponse & { departmentName: string }

export function ProgrammesListingPage() {
  const [programmes, setProgrammes] = useState<ProgrammeRow[]>([])
  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('All')
  const [level, setLevel] = useState('All')
  const [status, setStatus] = useState('All')
  const [page, setPage] = useState(1)
  const [drawer, setDrawer] = useState(false)
  const [editingProgramme, setEditingProgramme] = useState<ProgrammeRow | null>(null)
  const [deletingProgramme, setDeletingProgramme] = useState<ProgrammeRow | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [stats, setStats] = useState({
    totalProgrammes: 0,
    activeProgrammes: 0,
    inactiveProgrammes: 0,
    departments: 0,
  })

  const departmentFilterOptions = useMemo(
    () => ['All', ...departments.map(d => d.name).sort((a, b) => a.localeCompare(b))],
    [departments],
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const deptList = await listDepartments({ page: 1, limit: FETCH_LIMIT, status: 'ACTIVE' })
      const selectedDepartment = deptList.items.find(d => d.name === department)

      const [listResult, total, active, inactive] = await Promise.all([
        listProgrammes({
          page: 1,
          limit: FETCH_LIMIT,
          status: toApiStatus(status as 'Active' | 'Inactive' | 'All'),
          departmentId: selectedDepartment?.id,
        }),
        countProgrammes(),
        countProgrammes({ status: 'ACTIVE' }),
        countProgrammes({ status: 'INACTIVE' }),
      ])

      setDepartments(deptList.items)

      setProgrammes(
        listResult.items.map(item => ({
          ...item,
          departmentName: deptList.items.find(d => d.id === item.departmentId)?.name ?? '—',
        })),
      )
      setStats({
        totalProgrammes: total,
        activeProgrammes: active,
        inactiveProgrammes: inactive,
        departments: deptList.meta.total,
      })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load programmes.'
      toast.error(message)
      setProgrammes([])
    } finally {
      setLoading(false)
    }
  }, [department, status])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    return programmes.filter(prog => {
      const uiLevel = toUiDegreeLevel(prog.degreeLevel)
      const matchesQuery =
        query === '' ||
        `${prog.name} ${prog.code} ${prog.departmentName} ${uiLevel} ${asText(prog.description)}`
          .toLowerCase()
          .includes(query.toLowerCase())
      const matchesDepartment = department === 'All' || prog.departmentName === department
      const matchesLevel = level === 'All' || uiLevel === level
      return matchesQuery && matchesDepartment && matchesLevel
    })
  }, [programmes, query, department, level])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage * PAGE_SIZE, filtered.length)

  const hasFilters = query !== '' || department !== 'All' || level !== 'All' || status !== 'All'

  function clearFilters() {
    setQuery('')
    setDepartment('All')
    setLevel('All')
    setStatus('All')
    setPage(1)
  }

  function openCreateDrawer() {
    setEditingProgramme(null)
    setDrawer(true)
  }

  function openEditDrawer(programme: ProgrammeRow) {
    setEditingProgramme(programme)
    setDrawer(true)
  }

  function handleDrawerOpenChange(open: boolean) {
    if (!open) setEditingProgramme(null)
    setDrawer(open)
  }

  async function handleDeactivate() {
    if (!deletingProgramme) return
    setDeleting(true)
    try {
      await deactivateProgramme(deletingProgramme.id)
      toast.success('Programme deactivated')
      setDeletingProgramme(null)
      loadData()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to deactivate programme.'
      toast.error(message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <>
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-1 text-sm text-[#40559e]">
            Academic Catalogue <span className="px-1">›</span> Programmes
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#071759]">Programmes</h1>
          <p className="mt-1 text-[#43599e]">
            Manage academic programmes. Programmes belong to departments and can be offered in multiple intakes.
          </p>
        </div>
        <Button className="mt-7 h-11 bg-[#0c3cff] px-5 hover:bg-[#0934dc]" onClick={openCreateDrawer}>
          <Plus className="mr-2 h-4 w-4" />
          Create Programme
        </Button>
      </div>

      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard value={stats.totalProgrammes} label="Total Programmes" icon={GraduationCap} />
        <StatCard value={stats.activeProgrammes} label="Active Programmes" dotColor="bg-[#00a768]" dotBg="bg-[#e0f9ed]" />
        <StatCard value={stats.inactiveProgrammes} label="Inactive Programmes" dotColor="bg-[#31518d]" dotBg="bg-[#e9eef7]" />
        <StatCard value={stats.departments} label="Departments" icon={Building2} />
      </section>

      <Card className="overflow-hidden border-[#e1e8f5] shadow-none">
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
          <div className="w-full sm:w-44">
            <SearchSelect
              variant="filter"
              label="Department"
              value={department}
              onChange={value => {
                setDepartment(value)
                setPage(1)
              }}
              options={departmentFilterOptions}
              required={false}
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
              options={[...levelFilterOptions]}
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
              options={[...statusFilterOptions]}
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
          <table className="w-full min-w-[980px] text-left text-sm">
            <thead className="bg-[#f4f7fc] text-xs font-bold">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Programme Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Level</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowsSkeleton columns={7} />
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-[#6374ab]">
                    No programmes found.
                  </td>
                </tr>
              ) : (
                paginated.map((prog, index) => (
                  <tr
                    key={prog.id}
                    className={clickableTableRowClass}
                    onClick={() => openEditDrawer(prog)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        openEditDrawer(prog)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open ${prog.name}`}
                  >
                    <td className="px-4 py-3.5 text-[#19316f]">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                    <td className="px-4 py-3.5 font-medium text-[#071759]">{prog.name}</td>
                    <td className="px-4 py-3.5 text-[#19316f]">{prog.code}</td>
                    <td className="px-4 py-3.5 text-[#354a8d]">{prog.departmentName}</td>
                    <td className="px-4 py-3.5 text-[#19316f]">{toUiDegreeLevel(prog.degreeLevel)}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={toUiStatus(prog.status)} />
                    </td>
                    <td className="px-4 py-3.5" onClick={stopRowClickPropagation}>
                      <TableRowActions
                        onEdit={() => openEditDrawer(prog)}
                        onDelete={() => setDeletingProgramme(prog)}
                        disableDelete={prog.status === 'INACTIVE'}
                      />
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
        open={drawer}
        onOpenChange={handleDrawerOpenChange}
        onCreated={loadData}
        departments={departments}
        programme={editingProgramme}
      />

      <ConfirmDialog
        open={Boolean(deletingProgramme)}
        onOpenChange={open => {
          if (!open && !deleting) setDeletingProgramme(null)
        }}
        title="Deactivate programme?"
        description={
          deletingProgramme
            ? `"${deletingProgramme.name}" will be marked inactive and removed from future intake configurations.`
            : ''
        }
        confirmLabel="Deactivate"
        loading={deleting}
        onConfirm={handleDeactivate}
      />
    </>
  )
}
