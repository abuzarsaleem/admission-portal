import { useCallback, useEffect, useMemo, useState } from 'react'
import { Check, ChevronLeft, ChevronRight, FileText, Plus, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { CreateApplicationFeeDrawer } from '@/components/application-fees/CreateApplicationFeeDrawer'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { TableRowsSkeleton } from '@/components/shared/LoadingSkeletons'
import { SearchSelect } from '@/components/shared/SearchSelect'
import { StatCard } from '@/components/shared/StatCard'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { clickableTableRowClass, stopRowClickPropagation, TableRowActions } from '@/components/shared/TableRowActions'
import { listFeeTypes } from '@/lib/api/fee-types'
import { ApiError } from '@/lib/api/client'
import { countGeneralFees, deactivateGeneralFee, listGeneralFees } from '@/lib/api/general-fees'
import type { FeeTypeResponse, GeneralFeeResponse } from '@/lib/api/types'
import {
  formatAmount,
  formatFeeTypeLabel,
  toApiFeeStatus,
  toUiFeeStatus,
  type UiFeeStatus,
} from '@/lib/configuration-mappers'

const PAGE_SIZE = 10
const FETCH_LIMIT = 100

export function ApplicationFeesListingPage() {
  const [fees, setFees] = useState<GeneralFeeResponse[]>([])
  const [feeTypes, setFeeTypes] = useState<FeeTypeResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [feeTypeFilter, setFeeTypeFilter] = useState('All')
  const [status, setStatus] = useState<UiFeeStatus | 'All'>('All')
  const [page, setPage] = useState(1)
  const [drawer, setDrawer] = useState(false)
  const [editingFee, setEditingFee] = useState<GeneralFeeResponse | null>(null)
  const [deletingFee, setDeletingFee] = useState<GeneralFeeResponse | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [stats, setStats] = useState({ totalFees: 0, activeFees: 0 })

  const feeTypeFilterOptions = useMemo(
    () => ['All', ...feeTypes.map(type => type.name).sort((a, b) => a.localeCompare(b))],
    [feeTypes],
  )

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [typeList, listResult, total, active] = await Promise.all([
        listFeeTypes({ page: 1, limit: FETCH_LIMIT }),
        listGeneralFees({
          page: 1,
          limit: FETCH_LIMIT,
          status: toApiFeeStatus(status),
          feeType: feeTypeFilter === 'All' ? undefined : feeTypeFilter,
        }),
        countGeneralFees(),
        countGeneralFees({ status: 'ACTIVE' }),
      ])

      setFeeTypes(typeList.items)
      setFees(listResult.items)
      setStats({ totalFees: total, activeFees: active })
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to load application fees.'
      toast.error(message)
      setFees([])
    } finally {
      setLoading(false)
    }
  }, [feeTypeFilter, status])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = useMemo(() => {
    return fees.filter(fee => {
      const matchesQuery =
        query === '' ||
        `${fee.feeType} ${formatFeeTypeLabel(fee.feeType)} ${fee.amount} ${fee.currency}`
          .toLowerCase()
          .includes(query.toLowerCase())
      return matchesQuery
    })
  }, [fees, query])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
  const start = filtered.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1
  const end = Math.min(currentPage * PAGE_SIZE, filtered.length)

  const hasFilters = query !== '' || feeTypeFilter !== 'All' || status !== 'All'

  function clearFilters() {
    setQuery('')
    setFeeTypeFilter('All')
    setStatus('All')
    setPage(1)
  }

  function openCreateDrawer() {
    setEditingFee(null)
    setDrawer(true)
  }

  function openEditDrawer(fee: GeneralFeeResponse) {
    setEditingFee(fee)
    setDrawer(true)
  }

  function handleDrawerOpenChange(open: boolean) {
    if (!open) setEditingFee(null)
    setDrawer(open)
  }

  async function handleDeactivate() {
    if (!deletingFee) return
    setDeleting(true)
    try {
      await deactivateGeneralFee(deletingFee.id)
      toast.success('Application fee deactivated')
      setDeletingFee(null)
      loadData()
    } catch (error) {
      const message = error instanceof ApiError ? error.message : 'Failed to deactivate application fee.'
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
            Configuration <span className="px-1">›</span> Application Fees
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-[#071759]">Application Fees</h1>
          <p className="mt-1 text-[#43599e]">
            Manage reusable programme fee master records for programme offerings.
          </p>
        </div>
        <Button className="mt-7 h-11 bg-[#0c3cff] px-5 hover:bg-[#0934dc]" onClick={openCreateDrawer}>
          <Plus className="mr-2 h-4 w-4" />
          Create Application Fee
        </Button>
      </div>

      <section className="mb-5 grid gap-4 sm:grid-cols-2">
        <StatCard value={stats.totalFees} label="Total Fee Records" icon={FileText} />
        <StatCard value={stats.activeFees} label="Active Fees" icon={Check} iconBg="bg-[#e0f9ed] text-[#00a768]" />
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
              placeholder="Search fees..."
            />
          </div>
          <div className="w-full sm:w-52">
            <SearchSelect
              variant="filter"
              label="Fee Type"
              value={feeTypeFilter}
              onChange={value => {
                setFeeTypeFilter(value)
                setPage(1)
              }}
              options={feeTypeFilterOptions}
              required={false}
            />
          </div>
          <div className="w-full sm:w-44">
            <SearchSelect
              variant="filter"
              label="Status"
              value={status}
              onChange={value => {
                setStatus(value as UiFeeStatus | 'All')
                setPage(1)
              }}
              options={['All', 'Active', 'Inactive', 'Retired']}
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
                <th className="px-4 py-3">Fee Type</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Currency</th>
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
                    No fees found.
                  </td>
                </tr>
              ) : (
                paginated.map((fee, index) => (
                  <tr
                    key={fee.id}
                    className={clickableTableRowClass}
                    onClick={() => openEditDrawer(fee)}
                    onKeyDown={event => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        openEditDrawer(fee)
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Open ${formatFeeTypeLabel(fee.feeType)}`}
                  >
                    <td className="px-4 py-3.5 text-[#19316f]">{(currentPage - 1) * PAGE_SIZE + index + 1}</td>
                    <td className="px-4 py-3.5 font-medium text-[#071759]">{formatFeeTypeLabel(fee.feeType)}</td>
                    <td className="px-4 py-3.5 text-[#19316f]">{formatAmount(fee.amount)}</td>
                    <td className="px-4 py-3.5 text-[#19316f]">{fee.currency}</td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={toUiFeeStatus(fee.status)} />
                    </td>
                    <td className="px-4 py-3.5" onClick={stopRowClickPropagation}>
                      <TableRowActions
                        onEdit={() => openEditDrawer(fee)}
                        onDelete={() => setDeletingFee(fee)}
                        disableDelete={fee.status !== 'ACTIVE'}
                        deleteLabel="Deactivate"
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
            Showing {start} to {end} of {filtered.length} fees
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

      <CreateApplicationFeeDrawer
        open={drawer}
        onOpenChange={handleDrawerOpenChange}
        onCreated={loadData}
        feeTypes={feeTypes}
        fee={editingFee}
      />

      <ConfirmDialog
        open={Boolean(deletingFee)}
        onOpenChange={open => {
          if (!open && !deleting) setDeletingFee(null)
        }}
        title="Deactivate fee?"
        description={
          deletingFee
            ? `"${formatFeeTypeLabel(deletingFee.feeType)}" (${formatAmount(deletingFee.amount)} ${deletingFee.currency}) will be marked inactive.`
            : ''
        }
        confirmLabel="Deactivate"
        loading={deleting}
        onConfirm={handleDeactivate}
      />
    </>
  )
}
