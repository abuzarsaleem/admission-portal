import { useCallback, useEffect, useMemo, useState } from 'react'
import { BookOpen, Building2, ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CreateDepartmentDrawer } from '@/components/departments/CreateDepartmentDrawer'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TableRowsSkeleton } from '@/components/shared/LoadingSkeletons'
import { ApiError } from '@/lib/api/client'
import { getDepartmentsProgrammesStats } from '@/lib/api/catalog-stats'
import { deactivateDepartment, listDepartments } from '@/lib/api/departments'
import type { DepartmentResponse } from '@/lib/api/types'
import { asText, toApiStatus, toUiStatus } from '@/lib/catalog-mappers'
import { SearchSelect } from '@/components/shared/SearchSelect'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { clickableTableRowClass, stopRowClickPropagation, TableRowActions } from '@/components/shared/TableRowActions'
import { sortOptions, type SortOption } from '@/data/departments-data'

const PAGE_SIZE = 10
const FETCH_LIMIT = 100

function sortDepartments(items: DepartmentResponse[], sortBy: SortOption) {
  const sorted = [...items]
  const byStatusThenName = (a: DepartmentResponse, b: DepartmentResponse, desc = false) => {
    if (a.status !== b.status) return a.status === 'ACTIVE' ? -1 : 1
    return desc ? b.name.localeCompare(a.name) : a.name.localeCompare(b.name)
  }

  switch (sortBy) {
    case 'Name A - Z':
      return sorted.sort((a, b) => byStatusThenName(a, b))
    case 'Name Z - A':
      return sorted.sort((a, b) => byStatusThenName(a, b, true))
    case 'Code A - Z':
      return sorted.sort((a, b) => a.code.localeCompare(b.code))
    case 'Code Z - A':
      return sorted.sort((a, b) => b.code.localeCompare(a.code))
    default:
      return sorted
  }
}

export function DepartmentsListingPage() {
  const [departments, setDepartments] = useState<DepartmentResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('All')
  const [sortBy, setSortBy] = useState<SortOption>('Name A - Z')
  const [page, setPage] = useState(1)
  const [drawer, setDrawer] = useState(false)
  const [editingDepartment, setEditingDepartment] = useState<DepartmentResponse | null>(null)
  const [deletingDepartment, setDeletingDepartment] = useState<DepartmentResponse | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [stats, setStats] = useState({
    totalDepartments: 0,
    totalProgrammes: 0,
    activeDepartments: 0,
    inactiveDepartments: 0,
  })

  const loadStats = useCallback(async () => {
    try {
      const summary = await getDepartmentsProgrammesStats()
      setStats({
        totalDepartments: summary.totalDepartments,
        totalProgrammes: summary.totalProgrammes,
        activeDepartments: summary.activeDepartments,
        inactiveDepartments: summary.inactiveDepartments,
      })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load department stats.'
      toast.error(message)
    }
  }, [])

  const loadDepartments = useCallback(async () => {
    setLoading(true)
    try {
      const listResult = await listDepartments({
        page: 1,
        limit: FETCH_LIMIT,
        status: toApiStatus(status as 'Active' | 'Inactive' | 'All'),
      })
      setDepartments(listResult.items)
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load departments.'
      toast.error(message)
      setDepartments([])
    } finally {
      setLoading(false)
    }
  }, [status])

  const loadData = useCallback(async () => {
    await Promise.all([loadStats(), loadDepartments()])
  }, [loadStats, loadDepartments])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  useEffect(() => {
    loadDepartments()
  }, [loadDepartments])

  const filtered = useMemo(() => {
    const result = departments.filter(dept =>
      `${dept.name} ${dept.code} ${asText(dept.description)}`.toLowerCase().includes(query.toLowerCase()),
    )
    return sortDepartments(result, sortBy)
  }, [departments, query, sortBy])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage * PAGE_SIZE, filtered.length)

  const hasFilters = query !== '' || status !== 'All' || sortBy !== 'Name A - Z'

  function clearFilters() {
    setQuery('')
    setStatus('All')
    setSortBy('Name A - Z')
    setPage(1)
  }

  function openCreateDrawer() {
    setEditingDepartment(null)
    setDrawer(true)
  }

  function openEditDrawer(department: DepartmentResponse) {
    setEditingDepartment(department)
    setDrawer(true)
  }

  function handleDrawerOpenChange(open: boolean) {
    if (!open) setEditingDepartment(null)
    setDrawer(open)
  }

  async function handleDeactivate() {
    if (!deletingDepartment) return
    setDeleting(true)
    try {
      await deactivateDepartment(deletingDepartment.id)
      toast.success('Department deactivated')
      setDeletingDepartment(null)
      await loadData()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to deactivate department.'
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
            Academic Catalogue <span className="px-1">›</span> Departments
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#071759]">Departments</h1>
          <p className="mt-1 text-[#43599e]">Manage academic departments. Departments can have multiple programmes.</p>
        </div>
        <Button className="mt-7 h-11 bg-[#0c3cff] px-5 hover:bg-[#0934dc]" onClick={openCreateDrawer}>
          <Plus className="mr-2 h-4 w-4" />
          Create Department
        </Button>
      </div>

      <section className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard value={stats.totalDepartments} label="Total Departments" icon={Building2} />
        <StatCard value={stats.totalProgrammes} label="Total Programmes" icon={BookOpen} />
        <StatCard value={stats.activeDepartments} label="Active Departments" dotColor="bg-[#00a768]" dotBg="bg-[#e0f9ed]" />
        <StatCard value={stats.inactiveDepartments} label="Inactive Department" dotColor="bg-[#31518d]" dotBg="bg-[#e9eef7]" />
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
              placeholder="Search departments..."
            />
          </div>
          <div className="w-full sm:w-44">
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
          <div className="w-full sm:w-48">
            <SearchSelect
              variant="filter"
              label="Sort by"
              value={sortBy}
              onChange={value => {
                setSortBy(value as SortOption)
                setPage(1)
              }}
              options={[...sortOptions]}
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
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-[#f4f7fc] text-xs font-bold">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Department Name</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowsSkeleton columns={6} />
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-[#6374ab]">
                    No departments found.
                  </td>
                </tr>
              ) : (
                paginated.map((dept, index) => (
                  <tr
                    key={dept.id}
                    className={clickableTableRowClass}
                    onClick={() => openEditDrawer(dept)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        openEditDrawer(dept)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open ${dept.name}`}
                  >
                    <td className="px-4 py-3.5 text-[#19316f]">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                    <td className="px-4 py-3.5 font-medium text-[#071759]">{dept.name}</td>
                    <td className="px-4 py-3.5 text-[#19316f]">{dept.code}</td>
                    <td className="px-4 py-3.5 text-[#354a8d]">{asText(dept.description) || '—'}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={toUiStatus(dept.status)} />
                    </td>
                    <td className="px-4 py-3.5" onClick={stopRowClickPropagation}>
                      <TableRowActions
                        viewTo={`/catalog/departments/${dept.id}`}
                        onEdit={() => openEditDrawer(dept)}
                        onDelete={() => setDeletingDepartment(dept)}
                        disableDelete={dept.status === 'INACTIVE'}
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
            Showing {start} to {end} of {filtered.length} departments
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

      <CreateDepartmentDrawer
        open={drawer}
        onOpenChange={handleDrawerOpenChange}
        onCreated={loadData}
        department={editingDepartment}
      />

      <ConfirmDialog
        open={Boolean(deletingDepartment)}
        onOpenChange={open => {
          if (!open && !deleting) setDeletingDepartment(null)
        }}
        title="Deactivate department?"
        description={
          deletingDepartment
            ? `"${deletingDepartment.name}" will be marked inactive. Linked programmes will remain but cannot be assigned to new intakes.`
            : ''
        }
        confirmLabel="Deactivate"
        loading={deleting}
        onConfirm={handleDeactivate}
      />
    </>
  )
}
