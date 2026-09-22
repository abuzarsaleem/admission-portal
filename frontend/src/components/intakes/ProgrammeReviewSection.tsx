import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronRight as ChevronRightIcon,
  ClipboardList,
  ExternalLink,
  FileText,
  LayoutGrid,
  List,
  Receipt,
  Search,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { SearchSelect } from '@/components/shared/SearchSelect'
import { cn } from '@/lib/utils'
import type {
  IntakeProgrammeOption,
  ProgrammeConfig,
  ProgrammeOfferingState,
  SupportingInfoItem,
} from '@/types/intake-flow'

type ProgrammeReviewSectionProps = {
  programmes: IntakeProgrammeOption[]
  programmeConfigs: Record<string, ProgrammeConfig>
  programmeOfferings?: Record<string, ProgrammeOfferingState>
  criteriaLabels: Record<string, string>
  feeLabels: Record<string, string>
  getCounts?: (programmeId: string) => { criteria: number; fees: number; supporting: number }
  defaultViewMode?: ViewMode
  variant?: 'default' | 'review'
}

type ViewMode = 'browse' | 'overview'
type ConfigTab = 'criteria' | 'fees' | 'supporting'

const CLAMP_LINES = 3
const CHAR_CLAMP = 220

function CountBadge({ label, count }: { label: string; count: number }) {
  return (
    <span className="inline-flex items-center rounded-md bg-[#edf3ff] px-2 py-0.5 text-[11px] font-medium text-[#0644ff]">
      {count} {label}
    </span>
  )
}

function ExpandableText({ text, className }: { text: string; className?: string }) {
  const [expanded, setExpanded] = useState(false)
  const needsClamp = text.length > CHAR_CLAMP || text.split('\n').length > CLAMP_LINES
  if (!text) return null

  return (
    <div className={className}>
      <p
        className="whitespace-pre-wrap text-sm leading-relaxed text-[#354a8d]"
        style={
          !expanded && needsClamp
            ? { WebkitLineClamp: CLAMP_LINES, display: '-webkit-box', WebkitBoxOrient: 'vertical', overflow: 'hidden' }
            : undefined
        }
      >
        {text}
      </p>
      {needsClamp && (
        <button
          type="button"
          onClick={() => setExpanded(prev => !prev)}
          className="mt-1.5 text-xs font-semibold text-[#0c3cff] hover:text-[#0934dc]"
        >
          {expanded ? 'Show less' : 'Show full text'}
        </button>
      )}
    </div>
  )
}

function parseLabelledItem(label: string) {
  const isMandatory = label.includes('(Mandatory)')
  const cleaned = label.replace(/\s*\((Mandatory|Optional)\)\s*$/, '').trim()
  const colonIndex = cleaned.indexOf(':')
  if (colonIndex === -1) {
    return { title: cleaned, detail: '', isMandatory }
  }
  return {
    title: cleaned.slice(0, colonIndex).trim(),
    detail: cleaned.slice(colonIndex + 1).trim(),
    isMandatory,
  }
}

function isProgrammeComplete(config: ProgrammeConfig) {
  return config.selectedCriteriaIds.length > 0 && config.selectedFeeIds.length > 0
}

function ReviewDataTable({
  columns,
  rows,
  emptyMessage,
}: {
  columns: string[]
  rows: ReactNode[][]
  emptyMessage: string
}) {
  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-[#e4e9f4] bg-white px-4 py-10 text-center text-sm text-[#6374ab]">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-[#e4e9f4] bg-white">
      <table className="w-full min-w-[480px] text-left text-sm">
        <thead className="border-b border-[#e4e9f4] bg-[#f8faff] text-xs font-bold text-[#071759]">
          <tr>
            {columns.map(column => (
              <th key={column} className="px-4 py-3">
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells, rowIndex) => (
            <tr key={rowIndex} className="border-b border-[#e4e9f4] last:border-b-0">
              {cells.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3.5 text-[#19316f]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ProgrammeInformationBlock({
  programme,
  publishedDescription,
}: {
  programme: IntakeProgrammeOption
  publishedDescription: string
}) {
  return (
    <div className="rounded-lg border border-[#e4e9f4] bg-white p-5">
      <h4 className="text-sm font-bold text-[#071759]">Programme Information</h4>
      <div className="mt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6374ab]">Description</p>
        <p className="mt-1.5 text-sm leading-relaxed text-[#354a8d]">
          {publishedDescription.trim() || 'No description provided for this offering.'}
        </p>
      </div>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6374ab]">Department</p>
          <p className="mt-1 text-sm font-semibold text-[#0c3cff]">{programme.departmentName}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6374ab]">Level</p>
          <p className="mt-1 text-sm font-semibold text-[#0c3cff]">{programme.level}</p>
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6374ab]">Programme Code</p>
          <p className="mt-1 text-sm font-semibold text-[#0c3cff]">{programme.code}</p>
        </div>
      </div>
      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6374ab]">Additional Notes</p>
        <p className="mt-1.5 text-sm text-[#6374ab]">—</p>
      </div>
    </div>
  )
}

function ReviewProgrammeDetail({
  programme,
  config,
  criteriaLabels,
  feeLabels,
  publishedDescription,
  index,
  total,
  onPrevious,
  onNext,
  hasPrevious,
  hasNext,
}: {
  programme: IntakeProgrammeOption
  config: ProgrammeConfig
  criteriaLabels: Record<string, string>
  feeLabels: Record<string, string>
  publishedDescription: string
  index: number
  total: number
  onPrevious: () => void
  onNext: () => void
  hasPrevious: boolean
  hasNext: boolean
}) {
  const [activeTab, setActiveTab] = useState<ConfigTab>('criteria')
  const criteria = config.selectedCriteriaIds.map(id => criteriaLabels[id]).filter(Boolean)
  const fees = config.selectedFeeIds.map(id => feeLabels[id]).filter(Boolean)
  const supporting = config.supportingInfo.filter(item => !item.removed)
  const complete = isProgrammeComplete(config)

  const tabs: { id: ConfigTab; label: string; count: number }[] = [
    { id: 'criteria', label: 'Criteria', count: criteria.length },
    { id: 'fees', label: 'Fees', count: fees.length },
    { id: 'supporting', label: 'Supporting Information', count: supporting.length },
  ]

  const criteriaRows = criteria.map((item, i) => {
    const parsed = parseLabelledItem(item)
    return [
      i + 1,
      parsed.title,
      parsed.detail || '—',
      parsed.isMandatory ? (
        <Badge className="border-0 bg-[#d9f8eb] text-[#057a55] hover:bg-[#d9f8eb]">Yes</Badge>
      ) : (
        <Badge className="border-0 bg-[#f1f5fb] text-[#6374ab] hover:bg-[#f1f5fb]">No</Badge>
      ),
    ]
  })

  const feeRows = fees.map((item, i) => {
    const parsed = parseLabelledItem(item)
    return [i + 1, parsed.title, parsed.detail || item]
  })

  const supportingRows = supporting.map((item, i) => [
    i + 1,
    item.title || 'Untitled',
    item.informationType,
    item.mandatory ? (
      <Badge className="border-0 bg-[#d9f8eb] text-[#057a55] hover:bg-[#d9f8eb]">Yes</Badge>
    ) : (
      <Badge className="border-0 bg-[#f1f5fb] text-[#6374ab] hover:bg-[#f1f5fb]">No</Badge>
    ),
  ])

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6374ab]">
          Programme {index + 1} of {total}
        </p>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            className="border-[#dce5f6] text-[#354a8d]"
            onClick={onPrevious}
            disabled={!hasPrevious}
            aria-label="Previous programme"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            type="button"
            size="icon-sm"
            variant="outline"
            className="border-[#dce5f6] text-[#354a8d]"
            onClick={onNext}
            disabled={!hasNext}
            aria-label="Next programme"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-2xl font-bold text-[#071759]">{programme.name}</h3>
          <p className="mt-1 text-sm text-[#6374ab]">
            {programme.code} · {programme.departmentName} · {programme.level}
          </p>
        </div>
        {complete && (
          <Badge className="h-7 gap-1.5 border-0 bg-[#d9f8eb] px-3 text-sm text-[#057a55] hover:bg-[#d9f8eb]">
            <CheckCircle2 className="h-4 w-4" />
            Complete
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-1 border-b border-[#e4e9f4]">
        {tabs.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              '-mb-px rounded-t-lg px-4 py-2.5 text-sm font-semibold transition-colors',
              activeTab === tab.id
                ? 'border border-b-white border-[#e4e9f4] bg-white text-[#0c3cff]'
                : 'text-[#6374ab] hover:text-[#071759]',
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'criteria' && (
        <div>
          <h4 className="mb-3 text-sm font-bold text-[#071759]">Admission Criteria ({criteria.length})</h4>
          <ReviewDataTable
            columns={['#', 'Criteria Type', 'Requirement', 'Mandatory']}
            rows={criteriaRows}
            emptyMessage="No admission criteria selected for this programme."
          />
        </div>
      )}

      {activeTab === 'fees' && (
        <div>
          <h4 className="mb-3 text-sm font-bold text-[#071759]">Application Fees ({fees.length})</h4>
          <ReviewDataTable
            columns={['#', 'Fee Type', 'Amount']}
            rows={feeRows}
            emptyMessage="No application fees selected for this programme."
          />
        </div>
      )}

      {activeTab === 'supporting' && (
        <div>
          <h4 className="mb-3 text-sm font-bold text-[#071759]">Supporting Information ({supporting.length})</h4>
          {supporting.length === 0 ? (
            <div className="rounded-lg border border-[#e4e9f4] bg-white px-4 py-10 text-center text-sm text-[#6374ab]">
              No supporting information for this programme (optional).
            </div>
          ) : (
            <div className="space-y-3">
              <ReviewDataTable
                columns={['#', 'Title', 'Type', 'Mandatory']}
                rows={supportingRows}
                emptyMessage=""
              />
              {supporting.map(item => (
                <div key={item.clientId} className="rounded-lg border border-[#e4e9f4] bg-white p-4">
                  <p className="text-sm font-semibold text-[#071759]">{item.title}</p>
                  {item.content && <ExpandableText text={item.content} className="mt-2" />}
                  {item.referenceUrl.trim() && (
                    <a
                      href={item.referenceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#0c3cff]"
                    >
                      Open reference link
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <ProgrammeInformationBlock programme={programme} publishedDescription={publishedDescription} />
    </div>
  )
}

function ProgrammeConfigTabs({
  criteria,
  fees,
  supporting,
  compact = false,
}: {
  criteria: string[]
  fees: string[]
  supporting: SupportingInfoItem[]
  compact?: boolean
}) {
  const [activeTab, setActiveTab] = useState<ConfigTab>(
    criteria.length > 0 ? 'criteria' : fees.length > 0 ? 'fees' : 'supporting',
  )

  const tabs: { id: ConfigTab; label: string; icon: typeof ClipboardList; count: number }[] = [
    { id: 'criteria', label: 'Criteria', icon: ClipboardList, count: criteria.length },
    { id: 'fees', label: 'Fees', icon: Receipt, count: fees.length },
    { id: 'supporting', label: 'Supporting info', icon: FileText, count: supporting.length },
  ]

  return (
    <div className="overflow-hidden rounded-xl border border-[#e1e8f5] bg-[#f8faff]">
      <div className="flex flex-wrap gap-1 border-b border-[#e4e9f4] bg-white p-2">
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive ? 'bg-[#0c3cff] text-white' : 'text-[#354a8d] hover:bg-[#f4f7fc]',
                compact && 'px-2.5 py-1.5 text-xs',
              )}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  isActive ? 'bg-white/20 text-white' : 'bg-[#edf3ff] text-[#0644ff]',
                )}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>
      <div className={cn('overflow-y-auto p-4', compact ? 'max-h-[360px]' : 'max-h-[520px]')}>
        {activeTab === 'criteria' &&
          (criteria.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6374ab]">No criteria selected.</p>
          ) : (
            <ul className="space-y-2">
              {criteria.map((item, index) => {
                const parsed = parseLabelledItem(item)
                return (
                  <li key={item} className="rounded-lg border border-[#e8edf5] bg-white px-4 py-3 text-sm">
                    <span className="font-semibold text-[#071759]">{index + 1}. {parsed.title}</span>
                    {parsed.detail && <p className="mt-1 text-[#354a8d]">{parsed.detail}</p>}
                  </li>
                )
              })}
            </ul>
          ))}
        {activeTab === 'fees' &&
          (fees.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6374ab]">No fees selected.</p>
          ) : (
            <ul className="space-y-2">
              {fees.map((item, index) => (
                <li key={item} className="rounded-lg border border-[#e8edf5] bg-white px-4 py-3 text-sm text-[#071759]">
                  {index + 1}. {item}
                </li>
              ))}
            </ul>
          ))}
        {activeTab === 'supporting' &&
          (supporting.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#6374ab]">No supporting information.</p>
          ) : (
            <ul className="space-y-2">
              {supporting.map((item, index) => (
                <li key={item.clientId} className="rounded-lg border border-[#e8edf5] bg-white px-4 py-3 text-sm">
                  <p className="font-semibold text-[#071759]">
                    {index + 1}. {item.title}
                  </p>
                  {item.content && <ExpandableText text={item.content} className="mt-1" />}
                </li>
              ))}
            </ul>
          ))}
      </div>
    </div>
  )
}

function ProgrammeOverviewCard({
  programme,
  config,
  criteriaLabels,
  feeLabels,
  index,
  defaultExpanded,
}: {
  programme: IntakeProgrammeOption
  config: ProgrammeConfig
  criteriaLabels: Record<string, string>
  feeLabels: Record<string, string>
  index: number
  defaultExpanded?: boolean
}) {
  const [expanded, setExpanded] = useState(defaultExpanded ?? false)
  const criteria = config.selectedCriteriaIds.map(id => criteriaLabels[id]).filter(Boolean)
  const fees = config.selectedFeeIds.map(id => feeLabels[id]).filter(Boolean)
  const supporting = config.supportingInfo.filter(item => !item.removed)

  return (
    <Card className="overflow-hidden border-[#e1e8f5] shadow-none">
      <button
        type="button"
        onClick={() => setExpanded(prev => !prev)}
        className="flex w-full items-start justify-between gap-4 border-b border-[#e4e9f4] bg-[#f8faff] px-5 py-4 text-left hover:bg-[#f4f7fc]"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#6374ab]">Programme {index + 1}</p>
          <h3 className="mt-1 text-lg font-bold text-[#071759]">{programme.name}</h3>
          <p className="mt-0.5 text-sm text-[#6374ab]">
            {programme.code} · {programme.departmentName} · {programme.level}
          </p>
        </div>
        <ChevronRight className="h-5 w-5 shrink-0 text-[#6374ab]" />
      </button>
      {expanded && (
        <div className="p-4">
          <ProgrammeConfigTabs criteria={criteria} fees={fees} supporting={supporting} compact />
        </div>
      )}
    </Card>
  )
}

export function ProgrammeReviewSection({
  programmes,
  programmeConfigs,
  programmeOfferings = {},
  criteriaLabels,
  feeLabels,
  getCounts,
  defaultViewMode = 'browse',
  variant = 'default',
}: ProgrammeReviewSectionProps) {
  const isReviewLayout = variant === 'review'
  const [viewMode, setViewMode] = useState<ViewMode>(isReviewLayout ? 'browse' : defaultViewMode)
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('All')
  const [selectedProgrammeId, setSelectedProgrammeId] = useState<string | null>(null)

  const departmentOptions = useMemo(() => {
    const names = [...new Set(programmes.map(p => p.departmentName).filter(name => name && name !== '—'))].sort()
    return ['All', ...names]
  }, [programmes])

  const filteredProgrammes = useMemo(() => {
    return programmes.filter(programme => {
      const matchesQuery =
        query === '' ||
        `${programme.name} ${programme.code} ${programme.level} ${programme.departmentName}`
          .toLowerCase()
          .includes(query.toLowerCase())
      const matchesDepartment = department === 'All' || programme.departmentName === department
      return matchesQuery && matchesDepartment
    })
  }, [programmes, query, department])

  useEffect(() => {
    if (filteredProgrammes.length === 0) {
      setSelectedProgrammeId(null)
      return
    }
    if (!selectedProgrammeId || !filteredProgrammes.some(p => p.id === selectedProgrammeId)) {
      setSelectedProgrammeId(filteredProgrammes[0].id)
    }
  }, [filteredProgrammes, selectedProgrammeId])

  const selectedIndex = filteredProgrammes.findIndex(p => p.id === selectedProgrammeId)
  const selectedProgramme = selectedIndex >= 0 ? filteredProgrammes[selectedIndex] : null
  const selectedConfig = selectedProgramme ? programmeConfigs[selectedProgramme.id] : null

  function resolveCounts(programmeId: string, config: ProgrammeConfig) {
    if (getCounts) return getCounts(programmeId)
    return {
      criteria: config.selectedCriteriaIds.length,
      fees: config.selectedFeeIds.length,
      supporting: config.supportingInfo.filter(item => !item.removed).length,
    }
  }

  if (programmes.length === 0) {
    return (
      <Card className="border-[#e1e8f5] p-6 shadow-none">
        <h2 className="text-lg font-bold text-[#071759]">Programme Configurations</h2>
        <p className="mt-2 text-sm text-[#6374ab]">No programmes selected.</p>
      </Card>
    )
  }

  if (isReviewLayout) {
    return (
      <Card className="overflow-hidden border-[#e1e8f5] shadow-none">
        <div className="grid lg:grid-cols-[320px_1fr]">
          <div className="border-b border-[#e4e9f4] bg-[#f8faff] lg:border-r lg:border-b-0">
            <div className="border-b border-[#e4e9f4] px-4 py-4">
              <h3 className="text-sm font-bold text-[#071759]">Select a Programme</h3>
              <div className="mt-3 flex h-10 items-center gap-2 rounded-md border border-[#dce5f6] bg-white px-3">
                <Search className="h-4 w-4 shrink-0 text-[#6374ab]" />
                <Input
                  className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Search programmes..."
                />
              </div>
            </div>
            <ul className="max-h-[640px] overflow-y-auto p-3">
              {filteredProgrammes.map(programme => {
                const config = programmeConfigs[programme.id]
                if (!config) return null
                const counts = resolveCounts(programme.id, config)
                const isSelected = programme.id === selectedProgrammeId

                return (
                  <li key={programme.id} className="mb-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProgrammeId(programme.id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-lg border bg-white px-4 py-3.5 text-left transition-colors',
                        isSelected
                          ? 'border-[#0c3cff] border-l-4 bg-[#edf3ff] shadow-sm'
                          : 'border-[#e4e9f4] hover:border-[#c7d9ff] hover:bg-[#f8faff]',
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={cn('text-sm font-bold', isSelected ? 'text-[#0c3cff]' : 'text-[#071759]')}>
                          {programme.name}
                        </p>
                        <p className="mt-0.5 text-xs text-[#6374ab]">
                          {programme.code} · {programme.level}
                        </p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <CountBadge label="criteria" count={counts.criteria} />
                          <CountBadge label="fees" count={counts.fees} />
                          <CountBadge label="info" count={counts.supporting} />
                        </div>
                      </div>
                      <ChevronRightIcon className="h-5 w-5 shrink-0 text-[#6374ab]" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="bg-white p-6">
            {selectedProgramme && selectedConfig ? (
              <ReviewProgrammeDetail
                programme={selectedProgramme}
                config={selectedConfig}
                criteriaLabels={criteriaLabels}
                feeLabels={feeLabels}
                publishedDescription={programmeOfferings[selectedProgramme.id]?.publishedDescription ?? ''}
                index={selectedIndex}
                total={filteredProgrammes.length}
                onPrevious={() => setSelectedProgrammeId(filteredProgrammes[selectedIndex - 1]?.id ?? null)}
                onNext={() => setSelectedProgrammeId(filteredProgrammes[selectedIndex + 1]?.id ?? null)}
                hasPrevious={selectedIndex > 0}
                hasNext={selectedIndex < filteredProgrammes.length - 1}
              />
            ) : (
              <div className="flex min-h-[320px] items-center justify-center text-sm text-[#6374ab]">
                Select a programme to review its configuration.
              </div>
            )}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden border-[#e1e8f5] shadow-none">
      <div className="border-b border-[#e4e9f4] bg-[#f8faff] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-[#071759]">Programme Configurations</h2>
            <p className="mt-1 text-sm text-[#6374ab]">
              {programmes.length} programme{programmes.length === 1 ? '' : 's'} in this intake.
            </p>
          </div>
          <div className="flex rounded-lg border border-[#dce5f6] bg-white p-1">
            <button
              type="button"
              onClick={() => setViewMode('browse')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                viewMode === 'browse' ? 'bg-[#0c3cff] text-white' : 'text-[#354a8d] hover:bg-[#f4f7fc]',
              )}
            >
              <List className="h-4 w-4" />
              Browse
            </button>
            <button
              type="button"
              onClick={() => setViewMode('overview')}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                viewMode === 'overview' ? 'bg-[#0c3cff] text-white' : 'text-[#354a8d] hover:bg-[#f4f7fc]',
              )}
            >
              <LayoutGrid className="h-4 w-4" />
              Show all
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-md bg-white px-3 sm:max-w-xs">
            <Search className="h-4 w-4 shrink-0 text-[#6374ab]" />
            <Input
              className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search programmes..."
            />
          </div>
          <div className="w-full sm:w-44">
            <SearchSelect
              variant="filter"
              label="Department"
              value={department}
              onChange={setDepartment}
              options={departmentOptions}
              required={false}
            />
          </div>
        </div>
      </div>

      {viewMode === 'overview' ? (
        <div className="space-y-3 p-5">
          {filteredProgrammes.map((programme, index) => {
            const config = programmeConfigs[programme.id]
            if (!config) return null
            return (
              <ProgrammeOverviewCard
                key={programme.id}
                programme={programme}
                config={config}
                criteriaLabels={criteriaLabels}
                feeLabels={feeLabels}
                index={index}
                defaultExpanded={index === 0}
              />
            )
          })}
        </div>
      ) : (
        <div className="grid lg:grid-cols-[300px_1fr]">
          <div className="border-b border-[#e4e9f4] lg:border-r lg:border-b-0">
            <p className="border-b border-[#e4e9f4] px-4 py-3 text-xs font-semibold uppercase tracking-wide text-[#6374ab]">
              Select a programme
            </p>
            <ul className="max-h-[560px] overflow-y-auto p-2">
              {filteredProgrammes.map((programme, index) => {
                const config = programmeConfigs[programme.id]
                if (!config) return null
                const counts = resolveCounts(programme.id, config)
                const isSelected = programme.id === selectedProgrammeId
                return (
                  <li key={programme.id} className="mb-1">
                    <button
                      type="button"
                      onClick={() => setSelectedProgrammeId(programme.id)}
                      className={cn(
                        'w-full rounded-lg border px-3 py-3 text-left transition-colors',
                        isSelected
                          ? 'border-[#0c3cff] bg-[#edf3ff] ring-1 ring-[#0c3cff]/20'
                          : 'border-transparent hover:border-[#dce5f6] hover:bg-[#f4f7fc]',
                      )}
                    >
                      <p className="text-xs font-medium text-[#6374ab]">Programme {index + 1}</p>
                      <p className={cn('mt-0.5 text-sm font-semibold', isSelected ? 'text-[#0c3cff]' : 'text-[#071759]')}>
                        {programme.name}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <CountBadge label="criteria" count={counts.criteria} />
                        <CountBadge label="fees" count={counts.fees} />
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="p-5">
            {selectedProgramme && selectedConfig ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-[#071759]">{selectedProgramme.name}</h3>
                  <p className="mt-1 text-sm text-[#6374ab]">
                    {selectedProgramme.code} · {selectedProgramme.departmentName} · {selectedProgramme.level}
                  </p>
                </div>
                <ProgrammeConfigTabs
                  criteria={selectedConfig.selectedCriteriaIds.map(id => criteriaLabels[id]).filter(Boolean)}
                  fees={selectedConfig.selectedFeeIds.map(id => feeLabels[id]).filter(Boolean)}
                  supporting={selectedConfig.supportingInfo.filter(item => !item.removed)}
                />
              </div>
            ) : null}
          </div>
        </div>
      )}
    </Card>
  )
}
