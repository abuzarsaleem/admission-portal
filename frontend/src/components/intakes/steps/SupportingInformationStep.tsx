import { useEffect, useMemo, useState } from 'react'
import { Info, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  ProgrammeConfigurationSidebar,
  PROGRAMME_SIDEBAR_GRID,
} from '@/components/intakes/steps/ProgrammeConfigurationSidebar'
import { mergeDraftSupportingInfo, mergeDraftSupportingInfoInPlace } from '@/lib/programme-config-copy'
import type { SupportingInformationType } from '@/lib/api/types'
import type { IntakeFlowData, IntakeProgrammeOption, ProgrammeConfig, SupportingInfoItem } from '@/types/intake-flow'
import { createSupportingInfoDraft, defaultProgrammeConfig } from '@/types/intake-flow'

type SupportingInformationStepProps = {
  data: IntakeFlowData
  onChange: (data: IntakeFlowData) => void
  programmes: IntakeProgrammeOption[]
  showErrors: boolean
  configError?: string
}

const informationTypeOptions: { value: SupportingInformationType; label: string }[] = [
  { value: 'INSTRUCTION', label: 'Instruction' },
  { value: 'FAQ', label: 'FAQ' },
  { value: 'NOTE', label: 'Note' },
  { value: 'CONTACT', label: 'Contact' },
  { value: 'OTHER', label: 'Other' },
]

function isSupportingInfoConfigured(config?: ProgrammeConfig) {
  return !!config?.supportingInfoSaved
}

export function SupportingInformationStep({
  data,
  onChange,
  programmes,
  showErrors,
  configError,
}: SupportingInformationStepProps) {
  const selectedProgrammes = useMemo(
    () => programmes.filter(programme => data.selectedProgrammes.includes(programme.id)),
    [data.selectedProgrammes, programmes],
  )

  const [batchProgrammeIds, setBatchProgrammeIds] = useState<string[]>([])
  const [draftItems, setDraftItems] = useState<SupportingInfoItem[]>([])

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
      setDraftItems([])
      return
    }
    const firstConfig = data.programmeConfigs[batchProgrammeIds[0]] ?? defaultProgrammeConfig()
    const isSingleConfiguredEdit =
      batchProgrammeIds.length === 1 && isSupportingInfoConfigured(data.programmeConfigs[batchProgrammeIds[0]])

    if (isSingleConfiguredEdit) {
      setDraftItems(
        firstConfig.supportingInfo
          .filter(item => !item.removed)
          .map(item => ({
            ...item,
            clientId: item.clientId || crypto.randomUUID(),
          })),
      )
      return
    }

    setDraftItems(
      firstConfig.supportingInfo
        .filter(item => !item.removed)
        .map(item => ({ ...item, clientId: crypto.randomUUID(), groupId: crypto.randomUUID(), informationId: undefined })),
    )
  }, [batchProgrammeIds, data.programmeConfigs])

  const batchProgrammes = selectedProgrammes.filter(programme => batchProgrammeIds.includes(programme.id))
  const visibleItems = draftItems.filter(item => !item.removed)

  function addItem() {
    setDraftItems([
      ...draftItems,
      createSupportingInfoDraft({ displayOrder: visibleItems.length + 1 }),
    ])
  }

  function updateItem(clientId: string, patch: Partial<SupportingInfoItem>) {
    setDraftItems(draftItems.map(item => (item.clientId === clientId ? { ...item, ...patch } : item)))
  }

  function removeItem(clientId: string) {
    setDraftItems(draftItems.map(item => (item.clientId === clientId ? { ...item, removed: true } : item)))
  }

  function saveBatchConfiguration() {
    if (batchProgrammeIds.length === 0) {
      toast.error('Select at least one programme to configure.')
      return
    }

    for (const item of visibleItems) {
      if (item.title.trim().length > 0 && item.title.trim().length < 3) {
        toast.error('Each item title must be at least 3 characters.')
        return
      }
      if (item.content.trim().length > 0 && item.content.trim().length < 5) {
        toast.error('Each item content must be at least 5 characters.')
        return
      }
      if (item.title.trim() || item.content.trim()) {
        if (item.title.trim().length < 3 || item.content.trim().length < 5) {
          toast.error('Complete all supporting information fields or remove incomplete items.')
          return
        }
      }
    }

    const draftConfig: ProgrammeConfig = {
      ...defaultProgrammeConfig(),
      supportingInfo: draftItems,
    }

    const programmeConfigs = { ...data.programmeConfigs }
    const isSingleConfiguredEdit =
      batchProgrammeIds.length === 1 && isSupportingInfoConfigured(data.programmeConfigs[batchProgrammeIds[0]])

    for (const programmeId of batchProgrammeIds) {
      const existing = programmeConfigs[programmeId] ?? defaultProgrammeConfig()
      programmeConfigs[programmeId] = isSingleConfiguredEdit
        ? mergeDraftSupportingInfoInPlace(draftConfig, existing)
        : mergeDraftSupportingInfo(draftConfig, existing)
    }

    onChange({ ...data, programmeConfigs })
    const hasItems = draftItems.some(item => !item.removed)
    toast.success(
      isSingleConfiguredEdit
        ? hasItems
          ? 'Supporting information updated'
          : 'Programme marked with no supporting information'
        : hasItems
          ? `Supporting information saved for ${batchProgrammeIds.length} programme(s)`
          : `${batchProgrammeIds.length} programme(s) marked with no supporting information`,
    )
  }

  const isEditingConfigured =
    batchProgrammeIds.length > 0 &&
    batchProgrammeIds.every(id => isSupportingInfoConfigured(data.programmeConfigs[id]))

  if (selectedProgrammes.length === 0) {
    return (
      <Card className="border-[#e1e8f5] p-6 shadow-none">
        <p className="text-sm text-[#6374ab]">No programmes selected. Go back and select at least one programme.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div className="flex gap-3 rounded-lg border border-[#c7d9ff] bg-[#edf3ff] p-4">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-[#0c3cff]" />
        <p className="text-sm text-[#43599e]">
          Supporting information is optional — not every programme needs it. Add items only where needed, or continue
          without configuring this step. Select programmes to edit in batch, or click a green card to review. Changes
          sync to the API when you continue.
        </p>
      </div>

      {showErrors && configError && <p className="text-xs text-red-600">{configError}</p>}

      <div className={`grid gap-5 ${PROGRAMME_SIDEBAR_GRID}`}>
        <ProgrammeConfigurationSidebar
          programmes={selectedProgrammes}
          batchProgrammeIds={batchProgrammeIds}
          onBatchChange={setBatchProgrammeIds}
          isConfigured={programmeId => isSupportingInfoConfigured(data.programmeConfigs[programmeId])}
          progressLabel="programmes reviewed"
          getMeta={programmeId => {
            const count = (data.programmeConfigs[programmeId]?.supportingInfo ?? []).filter(item => !item.removed).length
            return count > 0 ? `${count} item${count === 1 ? '' : 's'}` : 'No items'
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

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-[#071759]">Supporting Information</h3>
                  <p className="mt-0.5 text-sm text-[#6374ab]">Optional notes and instructions for applicants.</p>
                </div>
                <Button type="button" size="sm" className="bg-[#0c3cff] hover:bg-[#0a33d4]" onClick={addItem}>
                  <Plus className="mr-1 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              {visibleItems.length === 0 ? (
                <Card className="border-dashed border-[#c7d4ef] p-8 text-center shadow-none">
                  <p className="text-sm text-[#6374ab]">
                    No items yet. You can save with no items, or click Add Item first.
                  </p>
                </Card>
              ) : (
                visibleItems.map((item, index) => (
                  <Card key={item.clientId} className="border-[#e1e8f5] p-5 shadow-none">
                    <div className="mb-4 flex items-center justify-between">
                      <p className="text-sm font-semibold text-[#071759]">Item {index + 1}</p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        onClick={() => removeItem(item.clientId)}
                      >
                        <Trash2 className="mr-1 h-4 w-4" />
                        Remove
                      </Button>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-[#071759]">Type</label>
                        <select
                          value={item.informationType}
                          onChange={e =>
                            updateItem(item.clientId, { informationType: e.target.value as SupportingInformationType })
                          }
                          className="h-10 w-full rounded-md border border-[#b8c6ed] bg-white px-3 text-sm text-[#071759]"
                        >
                          {informationTypeOptions.map(option => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-[#071759]">Title</label>
                        <Input
                          value={item.title}
                          onChange={e => updateItem(item.clientId, { title: e.target.value })}
                          placeholder="Application instruction"
                          className="h-10 border-[#b8c6ed]"
                        />
                        {showErrors && item.title.trim().length > 0 && item.title.trim().length < 3 && (
                          <p className="mt-1 text-xs text-red-600">Title must be at least 3 characters.</p>
                        )}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className="mb-1.5 block text-sm font-semibold text-[#071759]">Content</label>
                      <Textarea
                        value={item.content}
                        onChange={e => updateItem(item.clientId, { content: e.target.value })}
                        placeholder="Complete the online application and upload required documents."
                        className="min-h-[100px] border-[#b8c6ed]"
                      />
                      {showErrors && item.content.trim().length > 0 && item.content.trim().length < 5 && (
                        <p className="mt-1 text-xs text-red-600">Content must be at least 5 characters.</p>
                      )}
                    </div>

                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="mb-1.5 block text-sm font-semibold text-[#071759]">Reference URL (optional)</label>
                        <Input
                          value={item.referenceUrl}
                          onChange={e => updateItem(item.clientId, { referenceUrl: e.target.value })}
                          placeholder="https://admissions.example.edu/apply"
                          className="h-10 border-[#b8c6ed]"
                        />
                      </div>
                      <div className="flex items-end pb-2">
                        <label className="flex items-center gap-2 text-sm text-[#354a8d]">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-[#b8c6ed] accent-[#0c3cff]"
                            checked={item.mandatory}
                            onChange={e => updateItem(item.clientId, { mandatory: e.target.checked })}
                          />
                          Mandatory for publication readiness
                        </label>
                      </div>
                    </div>
                  </Card>
                ))
              )}

              <div className="flex justify-end">
                <Button type="button" className="bg-[#0c3cff] hover:bg-[#0a33d4]" onClick={saveBatchConfiguration}>
                  {visibleItems.length === 0
                    ? 'Save with no supporting info'
                    : isEditingConfigured
                      ? 'Update configuration'
                      : 'Save configuration'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
