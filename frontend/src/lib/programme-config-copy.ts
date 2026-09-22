import type { ProgrammeConfig, SupportingInfoItem } from '@/types/intake-flow'

export function mergeDraftCriteriaAndFees(source: ProgrammeConfig, target: ProgrammeConfig): ProgrammeConfig {
  const offeringCriteria: Record<string, string> = {}
  const offeringFees: Record<string, string> = {}

  for (const id of source.selectedCriteriaIds) {
    if (target.offeringCriteria[id]) offeringCriteria[id] = target.offeringCriteria[id]
  }
  for (const id of source.selectedFeeIds) {
    if (target.offeringFees[id]) offeringFees[id] = target.offeringFees[id]
  }

  return {
    ...target,
    selectedCriteriaIds: [...source.selectedCriteriaIds],
    selectedFeeIds: [...source.selectedFeeIds],
    offeringCriteria,
    offeringFees,
    criteriaFeesSaved: true,
  }
}

function cloneSupportingItem(item: SupportingInfoItem): SupportingInfoItem {
  return {
    ...item,
    clientId: crypto.randomUUID(),
    groupId: crypto.randomUUID(),
    informationId: undefined,
    removed: false,
  }
}

export function mergeDraftSupportingInfo(source: ProgrammeConfig, target: ProgrammeConfig): ProgrammeConfig {
  return {
    ...target,
    supportingInfo: source.supportingInfo.filter(item => !item.removed).map(cloneSupportingItem),
    supportingInfoSaved: true,
  }
}

export function mergeDraftSupportingInfoInPlace(source: ProgrammeConfig, target: ProgrammeConfig): ProgrammeConfig {
  return {
    ...target,
    supportingInfo: source.supportingInfo,
    supportingInfoSaved: true,
  }
}
