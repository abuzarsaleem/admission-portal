import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, FileText, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CreateAdmissionCriterionDrawer } from '@/components/admission-criteria/CreateAdmissionCriterionDrawer'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TableRowsSkeleton } from '@/components/shared/LoadingSkeletons'
import { MandatoryBadge } from '@/components/shared/MandatoryBadge'
import { SearchSelect } from '@/components/shared/SearchSelect'
import { StatCard } from '@/components/shared/StatCard'
import { clickableTableRowClass, stopRowClickPropagation, TableRowActions } from '@/components/shared/TableRowActions'
import { listCriteriaTypes } from '@/lib/api/criteria-types'
import { ApiError } from '@/lib/api/client'
import { countGeneralCriteria, deleteGeneralCriterion, listGeneralCriteria } from '@/lib/api/general-criteria'
import type { CriteriaTypeResponse, GeneralCriterionResponse } from '@/lib/api/types'
import { asText } from '@/lib/catalog-mappers'
import {
  criteriaDisplayName,
  toUiCriteriaOperator,
  toUiMandatory,
} from '@/lib/configuration-mappers'

const PAGE_SIZE = 10
const FETCH_LIMIT = 100

type CriterionRow = GeneralCriterionResponse & {
  criteriaTypeName: string
}

export function AdmissionCriteriaListingPage() {
  const [criteria, setCriteria] = useState<CriterionRow[]>([])
  const [criteriaTypes, setCriteriaTypes] = useState<CriteriaTypeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [criteriaTypeFilter, setCriteriaTypeFilter] = useState('All')
  const [mandatory, setMandatory] = useState('All')
  const [page, setPage] = useState(1)
  const [drawer, setDrawer] = useState(false)
  const [editingCriterion, setEditingCriterion] = useState<GeneralCriterionResponse | null>(null)
  const [deletingCriterion, setDeletingCriterion] = useState<GeneralCriterionResponse | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [stats, setStats] = useState({ totalCriteria: 0, mandatoryCriteria: 0 })

  const criteriaTypeFilterOptions = useMemo(
    () => ['All', ...criteriaTypes.map(type => type.name).sort((a, b) => a.localeCompare(b))],
    [criteriaTypes],
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const typeList = await listCriteriaTypes({ page: 1, limit: FETCH_LIMIT })
      const selectedType = typeList.items.find(type => type.name === criteriaTypeFilter)

      const [listResult, total, allCriteria] = await Promise.all([
        listGeneralCriteria({
          page: 1,
          limit: FETCH_LIMIT,
          criteriaTypeId: selectedType?.id,
        }),
        countGeneralCriteria(),
        listGeneralCriteria({ page: 1, limit: FETCH_LIMIT }),
      ])

      const types = typeList.items
      setCriteriaTypes(types)
      setCriteria(
        listResult.items.map(item => ({
          ...item,
          criteriaTypeName: types.find(type => type.id === item.criteriaTypeId)?.name ?? '—',
        })),
      )
      setStats({
        totalCriteria: total,
        mandatoryCriteria: allCriteria.items.filter(item => item.mandatory).length,
      })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load admission criteria.'
      toast.error(message)
      setCriteria([])
    } finally {
      setLoading(false)
    }
  }, [criteriaTypeFilter])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    return criteria.filter(item => {
      const displayName = criteriaDisplayName(item.criteriaName, item.criteriaTypeName)
      const matchesQuery =
        query === '' ||
        `${displayName} ${item.criteriaTypeName} ${item.criteriaRequirement} ${asText(item.criteriaUnit)}`
          .toLowerCase()
          .includes(query.toLowerCase())
      const matchesType = criteriaTypeFilter === 'All' || item.criteriaTypeName === criteriaTypeFilter
      const matchesMandatory =
        mandatory === 'All' || toUiMandatory(item.mandatory) === mandatory
      return matchesQuery && matchesType && matchesMandatory
    })
  }, [criteria, query, criteriaTypeFilter, mandatory])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage * PAGE_SIZE, filtered.length)

  const hasFilters = query !== '' || criteriaTypeFilter !== 'All' || mandatory !== 'All'

  function clearFilters() {
    setQuery('')
    setCriteriaTypeFilter('All')
    setMandatory('All')
    setPage(1)
  }

  function openCreateDrawer() {
    setEditingCriterion(null)
    setDrawer(true)
  }

  function openEditDrawer(criterion: GeneralCriterionResponse) {
    setEditingCriterion(criterion)
    setDrawer(true)
  }

  function handleDrawerOpenChange(open: boolean) {
    if (!open) setEditingCriterion(null)
    setDrawer(open)
  }

  async function handleDelete() {
    if (!deletingCriterion) return
    setDeleting(true)
    try {
      await deleteGeneralCriterion(deletingCriterion.id)
      toast.success('Admission criterion deleted')
      setDeletingCriterion(null)
      loadData()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to delete admission criterion.'
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
            Configuration <span className="px-1">›</span> Admission Criteria
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#071759]">Admission Criteria</h1>
          <p className="mt-1 text-[#43599e]">
            Manage reusable admission criteria master records for programme offerings.
          </p>
        </div>
        <Button className="mt-7 h-11 bg-[#0c3cff] px-5 hover:bg-[#0934dc]" onClick={openCreateDrawer}>
          <Plus className="mr-2 h-4 w-4" />
          Create Criterion
        </Button>
      </div>

      <section className="mb-5 grid gap-4 sm:grid-cols-2">
        <StatCard value={stats.totalCriteria} label="Total Criteria" icon={FileText} />
        <StatCard value={stats.mandatoryCriteria} label="Mandatory Criteria" icon={Check} iconBg="bg-[#e0f9ed] text-[#00a768]" />
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
              placeholder="Search criteria..."
            />
          </div>
          <div className="w-full sm:w-48">
            <SearchSelect
              variant="filter"
              label="Criteria Type"
              value={criteriaTypeFilter}
              onChange={value => {
                setCriteriaTypeFilter(value)
                setPage(1)
              }}
              options={criteriaTypeFilterOptions}
              required={false}
            />
          </div>
          <div className="w-full sm:w-40">
            <SearchSelect
              variant="filter"
              label="Mandatory"
              value={mandatory}
              onChange={value => {
                setMandatory(value)
                setPage(1)
              }}
              options={['All', 'Yes', 'No']}
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
                <th className="px-4 py-3">Criteria Type</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Requirement</th>
                <th className="px-4 py-3">Operator</th>
                <th className="px-4 py-3">Unit</th>
                <th className="px-4 py-3">Mandatory</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableRowsSkeleton columns={8} />
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-10 text-center text-[#6374ab]">
                    No criteria found.
                  </td>
                </tr>
              ) : (
                paginated.map((item, index) => (
                  <tr
                    key={item.id}
                    className={clickableTableRowClass}
                    onClick={() => openEditDrawer(item)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        openEditDrawer(item)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open ${criteriaDisplayName(item.criteriaName, item.criteriaTypeName)}`}
                  >
                    <td className="px-4 py-3.5 text-[#19316f]">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                    <td className="px-4 py-3.5 font-medium text-[#071759]">{item.criteriaTypeName}</td>
                    <td className="px-4 py-3.5 text-[#354a8d]">
                      {criteriaDisplayName(item.criteriaName, '—')}
                    </td>
                    <td className="px-4 py-3.5 text-[#354a8d]">{item.criteriaRequirement}</td>
                    <td className="px-4 py-3.5 text-[#19316f]">{toUiCriteriaOperator(item.criteriaOperator)}</td>
                    <td className="px-4 py-3.5 text-[#19316f]">{asText(item.criteriaUnit) || '—'}</td>
                    <td className="px-4 py-3.5">
                      <MandatoryBadge mandatory={toUiMandatory(item.mandatory)} />
                    </td>
                    <td className="px-4 py-3.5" onClick={stopRowClickPropagation}>
                      <TableRowActions
                        onEdit={() => openEditDrawer(item)}
                        onDelete={() => setDeletingCriterion(item)}
                        deleteLabel="Delete"
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
            Showing {start} to {end} of {filtered.length} criteria
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

      <CreateAdmissionCriterionDrawer
        open={drawer}
        onOpenChange={handleDrawerOpenChange}
        onCreated={loadData}
        criteriaTypes={criteriaTypes}
        criterion={editingCriterion}
      />

      <ConfirmDialog
        open={Boolean(deletingCriterion)}
        onOpenChange={open => {
          if (!open && !deleting) setDeletingCriterion(null)
        }}
        title="Delete criterion?"
        description={
          deletingCriterion
            ? `"${criteriaDisplayName(deletingCriterion.criteriaName, deletingCriterion.criteriaRequirement)}" will be permanently deleted. This fails if the criterion is still attached to an offering.`
            : ''
        }
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </>
  )
}
