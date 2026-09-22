import type { SupportingInformationType } from '@/lib/api/types'

export type ProgrammeOfferingState = {
  offeringId: string
  publishedDescription: string
}

export type SupportingInfoItem = {
  clientId: string
  groupId: string
  informationId?: string
  informationType: SupportingInformationType
  title: string
  content: string
  referenceUrl: string
  mandatory: boolean
  displayOrder: number | null
  removed?: boolean
}

export type ProgrammeConfig = {
  selectedCriteriaIds: string[]
  offeringCriteria: Record<string, string>
  selectedFeeIds: string[]
  offeringFees: Record<string, string>
  supportingInfo: SupportingInfoItem[]
  criteriaFeesSaved?: boolean
  supportingInfoSaved?: boolean
}

export type IntakeProgrammeOption = {
  id: string
  name: string
  code: string
  level: string
  departmentName: string
}

export type IntakeFlowData = {
  intakeId: string | null
  name: string
  code: string
  academicYear: string
  intakeType: string
  description: string
  opensDate: string
  opensTime: string
  closesDate: string
  closesTime: string
  selectedProgrammes: string[]
  programmeOfferings: Record<string, ProgrammeOfferingState>
  programmeConfigs: Record<string, ProgrammeConfig>
  criteriaLabels: Record<string, string>
  feeLabels: Record<string, string>
}

export const defaultProgrammeConfig = (): ProgrammeConfig => ({
  selectedCriteriaIds: [],
  offeringCriteria: {},
  selectedFeeIds: [],
  offeringFees: {},
  supportingInfo: [],
})

/** Mark programmes without explicit supporting-info edits as reviewed (empty is valid). */
export function ensureSupportingInfoReviewed(data: IntakeFlowData): IntakeFlowData {
  const programmeConfigs = { ...data.programmeConfigs }

  for (const programmeId of data.selectedProgrammes) {
    const config = programmeConfigs[programmeId] ?? defaultProgrammeConfig()
    if (config.supportingInfoSaved) continue

    programmeConfigs[programmeId] = {
      ...config,
      supportingInfo: config.supportingInfo.filter(item => !item.removed),
      supportingInfoSaved: true,
    }
  }

  return { ...data, programmeConfigs }
}

export function ensureProgrammeConfigs(
  selectedProgrammes: string[],
  existing: Record<string, ProgrammeConfig>,
): Record<string, ProgrammeConfig> {
  const next = { ...existing }
  for (const programmeId of selectedProgrammes) {
    if (!next[programmeId]) {
      next[programmeId] = defaultProgrammeConfig()
    }
  }
  for (const programmeId of Object.keys(next)) {
    if (!selectedProgrammes.includes(programmeId)) {
      delete next[programmeId]
    }
  }
  return next
}

export const defaultIntakeFlowData: IntakeFlowData = {
  intakeId: null,
  name: '',
  code: '',
  academicYear: '',
  intakeType: '',
  description: '',
  opensDate: '',
  opensTime: '09:00',
  closesDate: '',
  closesTime: '17:00',
  selectedProgrammes: [],
  programmeOfferings: {},
  programmeConfigs: {},
  criteriaLabels: {},
  feeLabels: {},
}

export function createSupportingInfoDraft(
  partial: Partial<Omit<SupportingInfoItem, 'clientId'>> = {},
): SupportingInfoItem {
  const groupId = partial.groupId ?? crypto.randomUUID()
  return {
    clientId: crypto.randomUUID(),
    informationType: partial.informationType ?? 'INSTRUCTION',
    title: partial.title ?? '',
    content: partial.content ?? '',
    referenceUrl: partial.referenceUrl ?? '',
    mandatory: partial.mandatory ?? false,
    displayOrder: partial.displayOrder ?? null,
    removed: partial.removed,
    informationId: partial.informationId,
    ...partial,
    groupId,
  }
}

export function supportingInfoSignature(item: Pick<SupportingInfoItem, 'informationType' | 'title' | 'content'>) {
  return `${item.informationType}::${item.title.trim()}::${item.content.trim()}`
}
