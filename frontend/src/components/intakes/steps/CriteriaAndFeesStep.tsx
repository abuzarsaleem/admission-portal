import { useEffect, useMemo, useState } from 'react'
import { Info, Search } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { MandatoryBadge } from '@/components/shared/MandatoryBadge'
import { moveOrderedId, SortableOrderList } from '@/components/shared/SortableOrderList'
import {
  ProgrammeConfigurationSidebar,
  PROGRAMME_SIDEBAR_GRID,
} from '@/components/intakes/steps/ProgrammeConfigurationSidebar'
import { CriteriaFeesStepSkeleton } from '@/components/shared/LoadingSkeletons'
import { listCriteriaTypes } from '@/lib/api/criteria-types'
import { ApiError } from '@/lib/api/client'
import { listGeneralCriteria } from '@/lib/api/general-criteria'
import { listGeneralFees } from '@/lib/api/general-fees'
import { mergeDraftCriteriaAndFees } from '@/lib/programme-config-copy'
import type { CriteriaTypeResponse, GeneralCriterionResponse, GeneralFeeResponse } from '@/lib/api/types'
import { criteriaDisplayName, formatAmount, formatFeeTypeLabel, toUiMandatory } from '@/lib/configuration-mappers'
import type { IntakeFlowData, IntakeProgrammeOption, ProgrammeConfig } from '@/types/intake-flow'
import { defaultProgrammeConfig } from '@/types/intake-flow'

type CriteriaAndFeesStepProps = {
  data: IntakeFlowData
  onChange: (data: IntakeFlowData) => void
  programmes: IntakeProgrammeOption[]
  showErrors: boolean
  configError?: string
}

type CriterionRow = GeneralCriterionResponse & { criteriaTypeName: string }

const checkboxClass = 'h-4 w-4 rounded border-[#b8c6ed] accent-[#0c3cff]'

function isCriteriaFeesConfigured(config?: ProgrammeConfig) {
  return !!config?.criteriaFeesSaved
}

export function CriteriaAndFeesStep({
  data,
  onChange,
  programmes,
  showErrors,
  configError,
}: CriteriaAndFeesStepProps) {
  const [criteriaCatalog, setCriteriaCatalog] = useState<CriterionRow[]>([])
  const [feesCatalog, setFeesCatalog] = useState<GeneralFeeResponse[]>([])
  const [loadingCatalog, setLoadingCatalog] = useState(true)
  const [batchProgrammeIds, setBatchProgrammeIds] = useState<string[]>([])
  const [draft, setDraft] = useState<ProgrammeConfig>(defaultProgrammeConfig())
  const [criteriaQuery, setCriteriaQuery] = useState('')
  const [feesQuery, setFeesQuery] = useState('')

  const selectedProgrammes = useMemo(
    () => programmes.filter(programme => data.selectedProgrammes.includes(programme.id)),
    [data.selectedProgrammes, programmes],
  )

  useEffect(() => {
    async function loadCatalog() {
      setLoadingCatalog(true)
      try {
        const [criteriaResult, feesResult, typesResult] = await Promise.all([
          listGeneralCriteria({ page: 1, limit: 100 }),
          listGeneralFees({ page: 1, limit: 100, status: 'ACTIVE' }),
          listCriteriaTypes({ page: 1, limit: 100 }),
        ])

        const typeMap = new Map(typesResult.items.map((type: CriteriaTypeResponse) => [type.id, type.name]))
        setCriteriaCatalog(
          criteriaResult.items.map(item => ({
            ...item,
            criteriaTypeName: typeMap.get(item.criteriaTypeId) ?? '—',
          })),
        )
        setFeesCatalog(feesResult.items)
      } catch (error) {
        const message = error instanceof ApiError ? error.message : 'Failed to load criteria and fees catalogue.'
        toast.error(message)
        setCriteriaCatalog([])
        setFeesCatalog([])
      } finally {
        setLoadingCatalog(false)
      }
    }

    loadCatalog()
  }, [])

  useEffect(() => {
    setBatchProgrammeIds(prev => {
      const valid = prev.filter(id => selectedProgrammes.some(programme => programme.id === id))
      if (valid.length > 0) return valid
      if (selectedProgrammes.length === 0) return []
      return [selectedProgrammes[0].id]
    })
  }, [selectedProgrammes, data.programmeConfigs])

  useEffect(() => {
    if (batchProgrammeIds.length === 0) {
      setDraft(defaultProgrammeConfig())
      return
    }
    const firstConfig = data.programmeConfigs[batchProgrammeIds[0]] ?? defaultProgrammeConfig()
    setDraft({
      ...defaultProgrammeConfig(),
      selectedCriteriaIds: [...firstConfig.selectedCriteriaIds],
      selectedFeeIds: [...firstConfig.selectedFeeIds],
      offeringCriteria: { ...firstConfig.offeringCriteria },
      offeringFees: { ...firstConfig.offeringFees },
      criteriaFeesSaved: firstConfig.criteriaFeesSaved,
    })
  }, [batchProgrammeIds, data.programmeConfigs])

  const batchProgrammes = selectedProgrammes.filter(programme => batchProgrammeIds.includes(programme.id))

  const filteredCriteria = useMemo(
    () =>
      criteriaCatalog.filter(item =>
        `${item.criteriaTypeName} ${item.criteriaRequirement} ${toUiMandatory(item.mandatory)}`
          .toLowerCase()
          .includes(criteriaQuery.toLowerCase()),
      ),
    [criteriaCatalog, criteriaQuery],
  )

  const filteredFees = useMemo(
    () =>
      feesCatalog.filter(fee =>
        `${formatFeeTypeLabel(fee.feeType)} ${fee.amount} ${fee.currency}`
          .toLowerCase()
          .includes(feesQuery.toLowerCase()),
      ),
    [feesCatalog, feesQuery],
  )

  function toggleCriterion(criterionId: string) {
    const selected = draft.selectedCriteriaIds.includes(criterionId)
    setDraft({
      ...draft,
      selectedCriteriaIds: selected
        ? draft.selectedCriteriaIds.filter(id => id !== criterionId)
        : [...draft.selectedCriteriaIds, criterionId],
    })
  }

  function toggleAllCriteria(checked: boolean) {
    const filteredIds = filteredCriteria.map(c => c.id)
    setDraft({
      ...draft,
      selectedCriteriaIds: checked
        ? [...new Set([...draft.selectedCriteriaIds, ...filteredIds])]
        : draft.selectedCriteriaIds.filter(id => !filteredIds.includes(id)),
    })
  }

  function toggleFee(feeId: string) {
    const selected = draft.selectedFeeIds.includes(feeId)
    setDraft({
      ...draft,
      selectedFeeIds: selected
        ? draft.selectedFeeIds.filter(id => id !== feeId)
        : [...draft.selectedFeeIds, feeId],
    })
  }

  function toggleAllFees(checked: boolean) {
    const filteredIds = filteredFees.map(f => f.id)
    setDraft({
      ...draft,
      selectedFeeIds: checked
        ? [...new Set([...draft.selectedFeeIds, ...filteredIds])]
        : draft.selectedFeeIds.filter(id => !filteredIds.includes(id)),
    })
  }

  function moveCriterion(id: string, direction: 'up' | 'down') {
    setDraft({
      ...draft,
      selectedCriteriaIds: moveOrderedId(draft.selectedCriteriaIds, id, direction),
    })
  }

  function moveFee(id: string, direction: 'up' | 'down') {
    setDraft({
      ...draft,
      selectedFeeIds: moveOrderedId(draft.selectedFeeIds, id, direction),
    })
  }

  const selectedCriteriaItems = draft.selectedCriteriaIds
    .map(id => criteriaCatalog.find(item => item.id === id))
    .filter((item): item is CriterionRow => !!item)
    .map(item => ({
      id: item.id,
      label: criteriaDisplayName(item.criteriaName, item.criteriaTypeName),
      detail: item.criteriaRequirement,
    }))

  const selectedFeeItems = draft.selectedFeeIds
    .map(id => feesCatalog.find(fee => fee.id === id))
    .filter((item): item is GeneralFeeResponse => !!item)
    .map(fee => ({
      id: fee.id,
      label: formatFeeTypeLabel(fee.feeType),
      detail: `${formatAmount(fee.amount)} ${fee.currency}`,
    }))

  function saveBatchConfiguration() {
    if (batchProgrammeIds.length === 0) {
      toast.error('Select at least one programme to configure.')
      return
    }
    if (draft.selectedCriteriaIds.length === 0 || draft.selectedFeeIds.length === 0) {
      toast.error('Select at least one criterion and one fee before saving.')
      return
    }

    const programmeConfigs = { ...data.programmeConfigs }
    for (const programmeId of batchProgrammeIds) {
      const existing = programmeConfigs[programmeId] ?? defaultProgrammeConfig()
      programmeConfigs[programmeId] = mergeDraftCriteriaAndFees(draft, existing)
    }

    onChange({ ...data, programmeConfigs })
    toast.success(
      batchProgrammeIds.every(id => isCriteriaFeesConfigured(data.programmeConfigs[id]))
        ? `Configuration updated for ${batchProgrammeIds.length} programme(s)`
        : `Configuration saved for ${batchProgrammeIds.length} programme(s)`,
    )
  }

  const isEditingConfigured =
    batchProgrammeIds.length > 0 &&
    batchProgrammeIds.every(id => isCriteriaFeesConfigured(data.programmeConfigs[id]))

  const allCriteriaSelected =
    filteredCriteria.length > 0 && filteredCriteria.every(c => draft.selectedCriteriaIds.includes(c.id))

  const allFeesSelected =
    filteredFees.length > 0 && filteredFees.every(f => draft.selectedFeeIds.includes(f.id))

  if (selectedProgrammes.length === 0) {
    return (
      <Card className="border-[#e1e8f5] p-6 shadow-none">
        <p className="text-sm text-[#6374ab]">No programmes selected. Go back and select at least one programme.</p>
      </Card>
    )
  }

  if (loadingCatalog) {
    return <CriteriaFeesStepSkeleton />
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-lg border border-[#c7d9ff] bg-[#edf3ff] p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#0c3cff]" />
        <p className="text-sm text-[#43599e]">
          Select pending programmes to configure in batch, or click a green configured card to review and update its
          criteria and fees. Changes are saved locally here and synced to the API when you continue.
        </p>
      </div>

      {showErrors && configError && <p className="text-xs text-red-600">{configError}</p>}

      <div className={`grid gap-5 ${PROGRAMME_SIDEBAR_GRID}`}>
        <ProgrammeConfigurationSidebar
          programmes={selectedProgrammes}
          batchProgrammeIds={batchProgrammeIds}
          onBatchChange={setBatchProgrammeIds}
          isConfigured={programmeId => isCriteriaFeesConfigured(data.programmeConfigs[programmeId])}
          getMeta={programmeId => {
            const config = data.programmeConfigs[programmeId]
            if (!config) return undefined
            return `${config.selectedCriteriaIds.length} criteria · ${config.selectedFeeIds.length} fees`
          }}
        />

        <div className="space-y-5">
          {batchProgrammeIds.length === 0 ? (
            <Card className="border-dashed border-[#c7d4ef] p-8 text-center shadow-none">
              <p className="text-sm text-[#6374ab]">Select a programme on the left to view its configuration.</p>
            </Card>
          ) : (
            <>
              <Card className="border-[#e1e8f5] p-5 shadow-none">
                <h2 className="text-lg font-bold text-[#071759]">
                  {isEditingConfigured ? 'Reviewing' : 'Configuring'} {batchProgrammes.length} programme
                  {batchProgrammes.length === 1 ? '' : 's'}
                </h2>
                <p className="mt-1 text-sm text-[#6374ab]">
                  {batchProgrammes.map(programme => `${programme.name} (${programme.code})`).join(' · ')}
                </p>
              </Card>

              <Card className="overflow-hidden border-[#e1e8f5] shadow-none">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e4e9f4] p-5">
                  <div>
                    <h3 className="text-base font-bold text-[#071759]">Admission Criteria</h3>
                    <p className="mt-0.5 text-sm text-[#6374ab]">
                      Select criteria, then reorder the selected list to set display order.
                    </p>
                  </div>
                  <div className="flex h-10 w-full min-w-[220px] max-w-xs items-center gap-2 rounded-md bg-[#f1f5fb] px-3 sm:w-auto">
                    <Search className="h-4 w-4 shrink-0 text-[#6374ab]" />
                    <Input
                      className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                      value={criteriaQuery}
                      onChange={e => setCriteriaQuery(e.target.value)}
                      placeholder="Search criteria..."
                    />
                  </div>
                </div>
                <div className="overflow-x-auto py-2">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-[#f4f7fc] text-xs font-bold">
                      <tr>
                        <th className="px-4 py-3">
                          <input
                            type="checkbox"
                            className={checkboxClass}
                            checked={allCriteriaSelected}
                            onChange={e => toggleAllCriteria(e.target.checked)}
                            aria-label="Select all criteria"
                          />
                        </th>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Criteria Type</th>
                        <th className="px-4 py-3">Requirement</th>
                        <th className="px-4 py-3">Mandatory</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCriteria.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#6374ab]">
                            No criteria in catalogue.
                          </td>
                        </tr>
                      ) : (
                        filteredCriteria.map((item, i) => {
                          const isChecked = draft.selectedCriteriaIds.includes(item.id)
                          const sortIndex = draft.selectedCriteriaIds.indexOf(item.id)
                          return (
                            <tr key={item.id} className={`border-t border-[#eef2f9] ${isChecked ? 'bg-[#f8fbff]' : ''}`}>
                              <td className="px-4 py-3.5">
                                <input
                                  type="checkbox"
                                  className={checkboxClass}
                                  checked={isChecked}
                                  onChange={() => toggleCriterion(item.id)}
                                />
                              </td>
                              <td className="px-4 py-3.5 text-[#6374ab]">
                                {isChecked ? sortIndex + 1 : i + 1}
                              </td>
                              <td className="px-4 py-3.5 font-medium text-[#071759]">
                                {criteriaDisplayName(item.criteriaName, item.criteriaTypeName)}
                              </td>
                              <td className="px-4 py-3.5 text-[#354a8d]">{item.criteriaRequirement}</td>
                              <td className="px-4 py-3.5">
                                <MandatoryBadge mandatory={toUiMandatory(item.mandatory)} />
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {draft.selectedCriteriaIds.length > 0 && (
                  <div className="border-t border-[#e4e9f4] p-5">
                    <h4 className="text-sm font-semibold text-[#071759]">Selected criteria order</h4>
                    <p className="mt-0.5 text-xs text-[#6374ab]">
                      Use the arrows to change the order applicants will see these criteria.
                    </p>
                    <div className="mt-3">
                      <SortableOrderList items={selectedCriteriaItems} onMove={moveCriterion} />
                    </div>
                  </div>
                )}
              </Card>

              <Card className="overflow-hidden border-[#e1e8f5] shadow-none">
                <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#e4e9f4] p-5">
                  <div>
                    <h3 className="text-base font-bold text-[#071759]">Application Fees</h3>
                    <p className="mt-0.5 text-sm text-[#6374ab]">
                      Select fees, then reorder the selected list to set display order.
                    </p>
                  </div>
                  <div className="flex h-10 w-full min-w-[220px] max-w-xs items-center gap-2 rounded-md bg-[#f1f5fb] px-3 sm:w-auto">
                    <Search className="h-4 w-4 shrink-0 text-[#6374ab]" />
                    <Input
                      className="h-auto border-0 bg-transparent p-0 shadow-none focus-visible:ring-0"
                      value={feesQuery}
                      onChange={e => setFeesQuery(e.target.value)}
                      placeholder="Search fees..."
                    />
                  </div>
                </div>
                <div className="overflow-x-auto py-2">
                  <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="bg-[#f4f7fc] text-xs font-bold">
                      <tr>
                        <th className="px-4 py-3">
                          <input
                            type="checkbox"
                            className={checkboxClass}
                            checked={allFeesSelected}
                            onChange={e => toggleAllFees(e.target.checked)}
                            aria-label="Select all fees"
                          />
                        </th>
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Fee Type</th>
                        <th className="px-4 py-3">Default Amount</th>
                        <th className="px-4 py-3">Currency</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFees.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#6374ab]">
                            No fees in catalogue.
                          </td>
                        </tr>
                      ) : (
                        filteredFees.map((fee, i) => {
                          const isChecked = draft.selectedFeeIds.includes(fee.id)
                          const sortIndex = draft.selectedFeeIds.indexOf(fee.id)
                          return (
                            <tr key={fee.id} className={`border-t border-[#eef2f9] ${isChecked ? 'bg-[#f8fbff]' : ''}`}>
                              <td className="px-4 py-3.5">
                                <input
                                  type="checkbox"
                                  className={checkboxClass}
                                  checked={isChecked}
                                  onChange={() => toggleFee(fee.id)}
                                />
                              </td>
                              <td className="px-4 py-3.5 text-[#6374ab]">
                                {isChecked ? sortIndex + 1 : i + 1}
                              </td>
                              <td className="px-4 py-3.5 font-medium text-[#071759]">{formatFeeTypeLabel(fee.feeType)}</td>
                              <td className="px-4 py-3.5 text-[#19316f]">{formatAmount(fee.amount)}</td>
                              <td className="px-4 py-3.5 text-[#19316f]">{fee.currency}</td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
                {draft.selectedFeeIds.length > 0 && (
                  <div className="border-t border-[#e4e9f4] p-5">
                    <h4 className="text-sm font-semibold text-[#071759]">Selected fees order</h4>
                    <p className="mt-0.5 text-xs text-[#6374ab]">
                      Use the arrows to change the order applicants will see these fees.
                    </p>
                    <div className="mt-3">
                      <SortableOrderList items={selectedFeeItems} onMove={moveFee} />
                    </div>
                  </div>
                )}
              </Card>

              <div className="flex justify-end">
                <Button
                  type="button"
                  className="bg-[#0c3cff] hover:bg-[#0a33d4]"
                  onClick={saveBatchConfiguration}
                >
                  {isEditingConfigured ? 'Update configuration' : 'Save configuration'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
