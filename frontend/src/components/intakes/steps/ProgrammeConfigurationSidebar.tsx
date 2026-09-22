import { useMemo, useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { SearchSelect } from '@/components/shared/SearchSelect'
import { cn } from '@/lib/utils'
import type { IntakeProgrammeOption } from '@/types/intake-flow'

export const PROGRAMME_SIDEBAR_GRID = 'lg:grid-cols-[360px_1fr]'

type ProgrammeConfigurationSidebarProps = {
  programmes: IntakeProgrammeOption[]
  batchProgrammeIds: string[]
  onBatchChange: (ids: string[]) => void
  isConfigured: (programmeId: string) => boolean
  getMeta?: (programmeId: string) => string | undefined
  progressLabel?: string
}

const checkboxClass = 'h-4 w-4 shrink-0 rounded border-[#b8c6ed] accent-[#0c3cff]'

export function ProgrammeConfigurationSidebar({
  programmes,
  batchProgrammeIds,
  onBatchChange,
  isConfigured,
  getMeta,
  progressLabel = 'programmes configured',
}: ProgrammeConfigurationSidebarProps) {
  const [department, setDepartment] = useState('All')

  const departmentFilterOptions = useMemo(() => {
    const names = [
      ...new Set(programmes.map(programme => programme.departmentName).filter(name => name && name !== '—')),
    ].sort((a, b) => a.localeCompare(b))
    return ['All', ...names]
  }, [programmes])

  const configuredProgrammes = programmes.filter(programme => isConfigured(programme.id))
  const pendingProgrammes = programmes.filter(programme => !isConfigured(programme.id))

  const filteredPending = useMemo(
    () =>
      pendingProgrammes.filter(
        programme => department === 'All' || programme.departmentName === department,
      ),
    [pendingProgrammes, department],
  )

  const configuredCount = configuredProgrammes.length
  const totalCount = programmes.length
  const progressPercent = totalCount > 0 ? Math.round((configuredCount / totalCount) * 100) : 0

  const allPendingSelected =
    filteredPending.length > 0 && filteredPending.every(programme => batchProgrammeIds.includes(programme.id))

  function togglePendingAll() {
    if (allPendingSelected) {
      onBatchChange(batchProgrammeIds.filter(id => !filteredPending.some(programme => programme.id === id)))
      return
    }
    onBatchChange([...new Set([...batchProgrammeIds, ...filteredPending.map(programme => programme.id)])])
  }

  function togglePendingOne(programmeId: string) {
    if (batchProgrammeIds.includes(programmeId)) {
      onBatchChange(batchProgrammeIds.filter(id => id !== programmeId))
      return
    }
    onBatchChange([...batchProgrammeIds, programmeId])
  }

  function selectConfigured(programmeId: string) {
    onBatchChange([programmeId])
  }

  return (
    <Card className="h-fit border-[#e1e8f5] shadow-none">
      <div className="border-b border-[#e4e9f4] p-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-bold text-[#071759]">Programme Offerings</h2>
          <Badge className="h-5 border-0 bg-[#e3edff] px-2 text-xs text-[#0644ff] hover:bg-[#e3edff]">
            {configuredCount}/{totalCount}
          </Badge>
        </div>

        <div className="mt-3">
          <div className="mb-1.5 flex items-center justify-between text-xs text-[#6374ab]">
            <span>{progressLabel}</span>
            <span className="font-semibold text-[#071759]">{progressPercent}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#e8edf5]">
            <div
              className="h-full rounded-full bg-[#00a768] transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        <div className="mt-3">
          <SearchSelect
            variant="filter"
            label="Department"
            value={department}
            onChange={setDepartment}
            options={departmentFilterOptions}
            required={false}
          />
        </div>
      </div>

      {configuredProgrammes.length > 0 && (
        <div className="border-b border-[#e4e9f4] p-3">
          <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[#00a768]">
            Configured · click to review
          </p>
          <ul className="space-y-2">
            {configuredProgrammes.map(prog => {
              const isActive = batchProgrammeIds.length === 1 && batchProgrammeIds[0] === prog.id
              return (
                <li key={prog.id}>
                  <button
                    type="button"
                    onClick={() => selectConfigured(prog.id)}
                    className={cn(
                      'flex w-full items-start gap-2 rounded-lg border px-3 py-2.5 text-left transition-colors',
                      isActive
                        ? 'border-[#0c3cff] bg-[#edf3ff] ring-1 ring-[#0c3cff]/20'
                        : 'border-[#b8efd8] bg-[#ecfdf5] hover:bg-[#dff9ee]',
                    )}
                  >
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00a768]" />
                    <span className="min-w-0">
                      <span className={cn('block text-sm font-semibold', isActive ? 'text-[#0c3cff]' : 'text-[#065f46]')}>
                        {prog.name}
                      </span>
                      <span className="mt-0.5 block text-xs text-[#047857]">
                        {prog.code} · {prog.departmentName}
                      </span>
                      {getMeta?.(prog.id) && (
                        <span className="mt-1 block text-[10px] font-medium text-[#059669]">{getMeta(prog.id)}</span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="p-3">
        <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-[#6374ab]">
          {pendingProgrammes.length > 0 ? 'Select to configure' : 'All done'}
        </p>
        {pendingProgrammes.length === 0 ? (
          <p className="px-1 py-2 text-center text-xs text-[#6374ab]">
            Every programme has been configured. Click a green card above to review or update.
          </p>
        ) : (
          <>
            <label className="mb-2 flex cursor-pointer items-center gap-2 px-1 text-xs font-medium text-[#354a8d]">
              <input
                type="checkbox"
                className={checkboxClass}
                checked={allPendingSelected}
                onChange={togglePendingAll}
              />
              Select all pending
            </label>
            <ul className="max-h-[280px] space-y-1 overflow-y-auto">
              {filteredPending.length === 0 ? (
                <li className="px-1 py-4 text-center text-xs text-[#6374ab]">No pending programmes in this department.</li>
              ) : (
                filteredPending.map(prog => {
                  const isSelected = batchProgrammeIds.includes(prog.id)
                  return (
                    <li key={prog.id}>
                      <label
                        className={`flex cursor-pointer items-start gap-3 rounded-md border-l-[3px] px-3 py-2.5 transition-colors ${
                          isSelected
                            ? 'border-l-[#0c3cff] bg-[#edf3ff]'
                            : 'border-l-transparent hover:bg-[#f4f7fc]'
                        }`}
                      >
                        <input
                          type="checkbox"
                          className={`${checkboxClass} mt-0.5`}
                          checked={isSelected}
                          onChange={() => togglePendingOne(prog.id)}
                        />
                        <span className="min-w-0">
                          <span className={`block text-sm font-semibold ${isSelected ? 'text-[#0c3cff]' : 'text-[#071759]'}`}>
                            {prog.name}
                          </span>
                          <span className="mt-0.5 block text-xs text-[#6374ab]">
                            {prog.code} · {prog.level}
                          </span>
                        </span>
                      </label>
                    </li>
                  )
                })
              )}
            </ul>
          </>
        )}
      </div>
    </Card>
  )
}
