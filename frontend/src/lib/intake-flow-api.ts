import {
  createOfferingCriteria,
  listOfferingCriteria,
  updateOfferingCriterion,
} from '@/lib/api/offering-criteria'
import { createOfferingFees, listOfferingFees, updateOfferingFee } from '@/lib/api/offering-fees'
import { createOffering, listOfferings } from '@/lib/api/offerings'
import {
  createOfferingSupportingInformation,
  listOfferingSupportingInformation,
  updateSupportingInformation,
} from '@/lib/api/supporting-information'
import { criteriaDisplayName, formatAmount, formatFeeTypeLabel, toUiMandatory } from '@/lib/configuration-mappers'
import { buildOfferingDescription } from '@/lib/intake-mappers'
import type {
  IntakeFlowData,
  IntakeProgrammeOption,
  ProgrammeConfig,
  ProgrammeOfferingState,
  SupportingInfoItem,
} from '@/types/intake-flow'
import { defaultProgrammeConfig, supportingInfoSignature } from '@/types/intake-flow'

function findProgrammeIdByOfferingId(
  programmeOfferings: Record<string, ProgrammeOfferingState>,
  offeringId: string,
): string | undefined {
  return Object.entries(programmeOfferings).find(([, offering]) => offering.offeringId === offeringId)?.[0]
}

export async function loadOfferingState(intakeId: string): Promise<{
  selectedProgrammes: string[]
  programmeOfferings: Record<string, ProgrammeOfferingState>
}> {
  const offerings = await listOfferings(intakeId, { page: 1, limit: 100 })
  const programmeOfferings: Record<string, ProgrammeOfferingState> = {}

  for (const offering of offerings.items) {
    programmeOfferings[offering.programmeId] = {
      offeringId: offering.id,
      publishedDescription: offering.publishedDescription,
    }
  }

  return {
    selectedProgrammes: offerings.items.map(item => item.programmeId),
    programmeOfferings,
  }
}

export type OfferingConfigurationLoadResult = {
  configs: Record<string, ProgrammeConfig>
  criteriaLabels: Record<string, string>
  feeLabels: Record<string, string>
}

export async function loadOfferingConfigurationState(
  programmeOfferings: Record<string, ProgrammeOfferingState>,
): Promise<OfferingConfigurationLoadResult> {
  const configs: Record<string, ProgrammeConfig> = {}
  const criteriaLabels: Record<string, string> = {}
  const feeLabels: Record<string, string> = {}
  const groupIdsBySignature = new Map<string, string>()

  await Promise.all(
    Object.entries(programmeOfferings).map(async ([programmeId, offering]) => {
      const config = defaultProgrammeConfig()

      const [criteriaResult, feesResult, supportingResult] = await Promise.all([
        listOfferingCriteria(offering.offeringId).catch(() => ({ items: [] })),
        listOfferingFees(offering.offeringId).catch(() => ({ items: [] })),
        listOfferingSupportingInformation(offering.offeringId).catch(() => ({ items: [] })),
      ])

      const sortedCriteria = [...criteriaResult.items].sort(
        (a, b) => (a.sequenceNo ?? Number.MAX_SAFE_INTEGER) - (b.sequenceNo ?? Number.MAX_SAFE_INTEGER),
      )
      for (const criterion of sortedCriteria) {
        if (!config.selectedCriteriaIds.includes(criterion.generalCriteriaId)) {
          config.selectedCriteriaIds.push(criterion.generalCriteriaId)
        }
        config.offeringCriteria[criterion.generalCriteriaId] = criterion.id
        criteriaLabels[criterion.generalCriteriaId] =
          `${criteriaDisplayName(criterion.criteriaName, 'Criteria')}: ${criterion.criteriaRequirement} (${toUiMandatory(criterion.mandatory) === 'Yes' ? 'Mandatory' : 'Optional'})`
      }

      const sortedFees = [...feesResult.items].sort(
        (a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER),
      )
      for (const fee of sortedFees) {
        if (!config.selectedFeeIds.includes(fee.generalFeeId)) {
          config.selectedFeeIds.push(fee.generalFeeId)
        }
        config.offeringFees[fee.generalFeeId] = fee.id
        feeLabels[fee.generalFeeId] =
          `${formatFeeTypeLabel(fee.feeType)}: ${formatAmount(fee.amount)} ${fee.currency}`
      }

      for (const item of supportingResult.items.filter(entry => entry.status === 'ACTIVE')) {
        const signature = supportingInfoSignature(item)
        let groupId = groupIdsBySignature.get(signature)
        if (!groupId) {
          groupId = crypto.randomUUID()
          groupIdsBySignature.set(signature, groupId)
        }

        config.supportingInfo.push({
          clientId: crypto.randomUUID(),
          groupId,
          informationId: item.id,
          informationType: item.informationType,
          title: item.title,
          content: item.content,
          referenceUrl: typeof item.referenceUrl === 'string' ? item.referenceUrl : '',
          mandatory: item.mandatory,
          displayOrder: item.displayOrder,
        })
      }

      if (config.selectedCriteriaIds.length > 0 && config.selectedFeeIds.length > 0) {
        config.criteriaFeesSaved = true
        config.supportingInfoSaved = true
      }

      configs[programmeId] = config
    }),
  )

  return { configs, criteriaLabels, feeLabels }
}

export async function syncProgrammeOfferings(
  intakeId: string,
  data: IntakeFlowData,
  programmes: IntakeProgrammeOption[],
): Promise<Record<string, ProgrammeOfferingState>> {
  const existing = await listOfferings(intakeId, { page: 1, limit: 100 })
  const nextOfferings = { ...data.programmeOfferings }

  for (const offering of existing.items) {
    if (!nextOfferings[offering.programmeId]) {
      nextOfferings[offering.programmeId] = {
        offeringId: offering.id,
        publishedDescription: offering.publishedDescription,
      }
    }
  }

  for (const programmeId of data.selectedProgrammes) {
    if (nextOfferings[programmeId]) continue

    const programme = programmes.find(item => item.id === programmeId)
    const created = await createOffering(intakeId, {
      programmeId,
      publishedDescription: buildOfferingDescription(programme?.name ?? 'Programme', data.name),
      displayOrder: data.selectedProgrammes.indexOf(programmeId) + 1,
    })

    nextOfferings[programmeId] = {
      offeringId: created.id,
      publishedDescription: created.publishedDescription,
    }
  }

  return nextOfferings
}

export async function syncCriteriaAndFees(data: IntakeFlowData): Promise<Record<string, ProgrammeConfig>> {
  const nextConfigs = { ...data.programmeConfigs }

  for (const programmeId of data.selectedProgrammes) {
    const offering = data.programmeOfferings[programmeId]
    let config = nextConfigs[programmeId] ?? defaultProgrammeConfig()
    if (!offering?.offeringId) {
      nextConfigs[programmeId] = config
      continue
    }

    const missingCriteriaIds = config.selectedCriteriaIds.filter(id => !config.offeringCriteria[id])
    if (missingCriteriaIds.length > 0) {
      const result = await createOfferingCriteria({
        offeringIds: [offering.offeringId],
        criteria: missingCriteriaIds.map(generalCriteriaId => ({
          generalCriteriaId,
          sequenceNo: config.selectedCriteriaIds.indexOf(generalCriteriaId) + 1,
        })),
      })

      for (const item of result.items) {
        config = {
          ...config,
          selectedCriteriaIds: config.selectedCriteriaIds.includes(item.generalCriteriaId)
            ? config.selectedCriteriaIds
            : [...config.selectedCriteriaIds, item.generalCriteriaId],
          offeringCriteria: {
            ...config.offeringCriteria,
            [item.generalCriteriaId]: item.id,
          },
        }
      }
    }

    for (let index = 0; index < config.selectedCriteriaIds.length; index += 1) {
      const generalCriteriaId = config.selectedCriteriaIds[index]
      const offeringCriteriaId = config.offeringCriteria[generalCriteriaId]
      if (!offeringCriteriaId) continue
      await updateOfferingCriterion(offeringCriteriaId, { sequenceNo: index + 1 })
    }

    const missingFeeIds = config.selectedFeeIds.filter(id => !config.offeringFees[id])
    if (missingFeeIds.length > 0) {
      const result = await createOfferingFees({
        offeringIds: [offering.offeringId],
        fees: missingFeeIds.map(generalFeeId => ({
          generalFeeId,
          sortOrder: config.selectedFeeIds.indexOf(generalFeeId) + 1,
        })),
      })

      for (const item of result.items) {
        config = {
          ...config,
          selectedFeeIds: config.selectedFeeIds.includes(item.generalFeeId)
            ? config.selectedFeeIds
            : [...config.selectedFeeIds, item.generalFeeId],
          offeringFees: {
            ...config.offeringFees,
            [item.generalFeeId]: item.id,
          },
        }
      }
    }

    for (let index = 0; index < config.selectedFeeIds.length; index += 1) {
      const generalFeeId = config.selectedFeeIds[index]
      const offeringFeeId = config.offeringFees[generalFeeId]
      if (!offeringFeeId) continue
      await updateOfferingFee(offeringFeeId, { sortOrder: index + 1 })
    }

    nextConfigs[programmeId] = config
  }

  return nextConfigs
}

function buildSupportingInfoPayload(item: SupportingInfoItem) {
  return {
    informationType: item.informationType,
    title: item.title.trim(),
    content: item.content.trim(),
    referenceUrl: item.referenceUrl.trim() || null,
    mandatory: item.mandatory,
    displayOrder: item.displayOrder,
  }
}

export async function syncSupportingInformation(data: IntakeFlowData): Promise<Record<string, ProgrammeConfig>> {
  const nextConfigs = { ...data.programmeConfigs }

  for (const programmeId of data.selectedProgrammes) {
    const config = nextConfigs[programmeId] ?? defaultProgrammeConfig()
    for (const item of config.supportingInfo) {
      if (item.removed && item.informationId) {
        await updateSupportingInformation(item.informationId, { status: 'INACTIVE' })
      }
    }
  }

  const createGroups = new Map<
    string,
    { offeringIds: string[]; item: SupportingInfoItem; programmeIds: string[] }
  >()

  for (const programmeId of data.selectedProgrammes) {
    const offering = data.programmeOfferings[programmeId]
    const config = nextConfigs[programmeId] ?? defaultProgrammeConfig()
    if (!offering?.offeringId) continue

    for (const item of config.supportingInfo) {
      if (item.removed) continue

      if (item.informationId) {
        await updateSupportingInformation(item.informationId, buildSupportingInfoPayload(item))
        continue
      }

      const group = createGroups.get(item.groupId) ?? {
        offeringIds: [],
        programmeIds: [],
        item,
      }
      group.offeringIds.push(offering.offeringId)
      group.programmeIds.push(programmeId)
      createGroups.set(item.groupId, group)
    }
  }

  for (const group of createGroups.values()) {
    const uniqueOfferingIds = [...new Set(group.offeringIds)]
    if (uniqueOfferingIds.length === 0) continue

    const result = await createOfferingSupportingInformation({
      offeringIds: uniqueOfferingIds,
      items: [buildSupportingInfoPayload(group.item)],
    })

    for (const created of result.items) {
      const programmeId = findProgrammeIdByOfferingId(data.programmeOfferings, created.programmeOfferingId)
      if (!programmeId) continue
      const config = nextConfigs[programmeId] ?? defaultProgrammeConfig()
      nextConfigs[programmeId] = {
        ...config,
        supportingInfo: config.supportingInfo
          .filter(entry => !entry.removed)
          .map(entry =>
            entry.groupId === group.item.groupId
              ? { ...entry, informationId: created.id, removed: false }
              : entry,
          ),
      }
    }
  }

  for (const programmeId of data.selectedProgrammes) {
    const config = nextConfigs[programmeId] ?? defaultProgrammeConfig()
    nextConfigs[programmeId] = {
      ...config,
      supportingInfo: config.supportingInfo.filter(item => !item.removed),
      supportingInfoSaved: true,
    }
  }

  return nextConfigs
}
