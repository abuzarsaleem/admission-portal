import type { ApplicationStepId, QualificationLevel } from '@/lib/api/types'

export const APPLICATION_STEPS: Array<{
  id: ApplicationStepId
  number: number
  title: string
  shortTitle: string
  description: string
}> = [
  {
    id: 'profile',
    number: 1,
    title: 'Personal Information',
    shortTitle: 'Personal',
    description: 'Your personal details, photograph, address, and emergency contact.',
  },
  {
    id: 'programme',
    number: 2,
    title: 'Programme Selection',
    shortTitle: 'Programme',
    description: 'Choose your preferred programmes for this intake.',
  },
  {
    id: 'academic',
    number: 3,
    title: 'Academic Details',
    shortTitle: 'Academic',
    description: 'Add qualifications and supporting documents.',
  },
  {
    id: 'declaration',
    number: 4,
    title: 'Declarations',
    shortTitle: 'Declarations',
    description: 'Review and accept the required declarations.',
  },
  {
    id: 'review',
    number: 5,
    title: 'Review & Submit',
    shortTitle: 'Review',
    description: 'Confirm your application and submit for review.',
  },
]

export const APPLICATION_STEP_ORDER: ApplicationStepId[] = APPLICATION_STEPS.map(
  step => step.id,
)

export function qualificationLevelFromDegree(degreeLevel: string): QualificationLevel {
  const normalized = degreeLevel.toLowerCase()
  if (normalized.includes('phd') || normalized.includes('doctor')) return 'PHD'
  if (
    normalized.includes('master') ||
    normalized.includes('post') ||
    normalized === 'pg' ||
    normalized.includes('ms') ||
    normalized.includes('mphil')
  ) {
    return 'POSTGRADUATE'
  }
  return 'UNDERGRADUATE'
}

export function qualificationLevelLabel(level: QualificationLevel) {
  if (level === 'UNDERGRADUATE') return 'Undergraduate'
  if (level === 'POSTGRADUATE') return 'Postgraduate'
  return 'PhD'
}

export function calcPercentage(obtained: string, total: string) {
  const obt = Number(obtained)
  const tot = Number(total)
  if (!Number.isFinite(obt) || !Number.isFinite(tot) || tot <= 0) return 0
  return Math.round((obt / tot) * 10000) / 100
}

export const DEGREE_TYPE_OPTIONS = [
  { value: 'SSC', label: 'Matriculation (SSC)' },
  { value: 'HSSC', label: 'Intermediate (HSSC)' },
  { value: 'FSC', label: 'FSc' },
  { value: 'FA', label: 'FA' },
  { value: 'ICS', label: 'ICS' },
  { value: 'OLEVEL', label: 'O-Level' },
  { value: 'ALEVEL', label: 'A-Level' },
  { value: 'BS', label: 'Bachelor (BS)' },
  { value: 'BA', label: 'Bachelor (BA)' },
  { value: 'BSC', label: 'Bachelor (BSc)' },
  { value: 'MS', label: 'Master (MS)' },
  { value: 'MA', label: 'Master (MA)' },
  { value: 'MPhil', label: 'MPhil' },
  { value: 'PhD', label: 'PhD' },
  { value: 'OTHER', label: 'Other' },
] as const

export const DIVISION_OPTIONS = [
  { value: '1st', label: '1st Division' },
  { value: '2nd', label: '2nd Division' },
  { value: '3rd', label: '3rd Division' },
  { value: 'N/A', label: 'N/A' },
] as const

export const GRADE_OPTIONS = [
  { value: 'A+', label: 'A+' },
  { value: 'A', label: 'A' },
  { value: 'B', label: 'B' },
  { value: 'C', label: 'C' },
  { value: 'D', label: 'D' },
  { value: 'E', label: 'E' },
  { value: 'N/A', label: 'N/A' },
] as const

export const DOCUMENT_TYPE_OPTIONS = [
  { value: 'MARKSHEET', label: 'Mark Sheet' },
  { value: 'CERTIFICATE', label: 'Certificate' },
  { value: 'TRANSCRIPT', label: 'Transcript' },
] as const

export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
] as const

export const MARITAL_STATUS_OPTIONS = [
  { value: 'SINGLE', label: 'Single' },
  { value: 'MARRIED', label: 'Married' },
  { value: 'OTHER', label: 'Other' },
] as const

export const CONTACT_TYPE_OPTIONS = [
  { value: 'EMERGENCY', label: 'Emergency' },
  { value: 'PARENT', label: 'Parent' },
  { value: 'GUARDIAN', label: 'Guardian' },
] as const

export const ADDRESS_TYPE_OPTIONS = [
  { value: 'PRIMARY', label: 'Primary' },
  { value: 'SECONDARY', label: 'Secondary' },
] as const

export const REFERRAL_OPTIONS = [
  { value: 'FRIEND', label: 'Friend' },
  { value: 'FAMILY', label: 'Family' },
  { value: 'SOCIAL', label: 'Social Media' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'ADVERTISEMENT', label: 'Advertisement' },
  { value: 'OTHER', label: 'Other' },
] as const
