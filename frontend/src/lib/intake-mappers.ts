import type { IntakeResponse, IntakeStatus } from '@/lib/api/types'
import type { IntakeFlowData } from '@/types/intake-flow'

export type UiIntakeStatus = 'Draft' | 'Under Review' | 'Published' | 'Closed'

const INTAKE_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{1,99}$/

export function isValidIntakeCode(code: string): boolean {
  return INTAKE_CODE_PATTERN.test(code.trim())
}

export function combineDateAndTime(date: string, time: string): string {
  const [hours = '00', minutes = '00'] = (time || '00:00').split(':')
  const local = new Date(`${date}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`)
  return local.toISOString()
}

export function splitIsoToDateTime(iso: string): { date: string; time: string } {
  if (!iso) return { date: '', time: '09:00' }
  const value = new Date(iso)
  if (Number.isNaN(value.getTime())) return { date: '', time: '09:00' }
  const date = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
  const time = `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`
  return { date, time }
}

export function formatApplicationPeriod(openAt: string, closeAt: string): string {
  const open = splitIsoToDateTime(openAt)
  const close = splitIsoToDateTime(closeAt)
  if (!open.date || !close.date) return '—'
  return `${formatDisplayDate(open.date)} – ${formatDisplayDate(close.date)}`
}

export function formatDisplayDate(isoOrDate: string): string {
  const value = isoOrDate.includes('T') ? new Date(isoOrDate) : new Date(`${isoOrDate}T00:00:00`)
  if (Number.isNaN(value.getTime())) return isoOrDate
  return value.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatLastUpdated(iso: string): string {
  return formatDisplayDate(iso)
}

export function toUiIntakeStatus(status: IntakeStatus): UiIntakeStatus {
  switch (status) {
    case 'UNDER_REVIEW':
      return 'Under Review'
    case 'PUBLISHED':
      return 'Published'
    case 'CLOSED':
      return 'Closed'
    default:
      return 'Draft'
  }
}

export function toApiIntakeStatus(status: UiIntakeStatus | 'All'): IntakeStatus | undefined {
  if (status === 'All') return undefined
  switch (status) {
    case 'Under Review':
      return 'UNDER_REVIEW'
    case 'Published':
      return 'PUBLISHED'
    case 'Closed':
      return 'CLOSED'
    default:
      return 'DRAFT'
  }
}

export function intakeToFlowData(intake: IntakeResponse): IntakeFlowData {
  const opens = splitIsoToDateTime(intake.applicationOpenAt)
  const closes = splitIsoToDateTime(intake.applicationCloseAt)

  return {
    intakeId: intake.id,
    name: intake.intakeName,
    code: intake.intakeCode,
    academicYear: '',
    intakeType: '',
    description: '',
    opensDate: opens.date,
    opensTime: opens.time,
    closesDate: closes.date,
    closesTime: closes.time,
    selectedProgrammes: [],
    programmeOfferings: {},
    programmeConfigs: {},
  }
}

export function getPlaceholderApplicationWindow() {
  const open = new Date()
  open.setDate(open.getDate() + 1)
  open.setHours(9, 0, 0, 0)

  const close = new Date(open)
  close.setDate(close.getDate() + 90)
  close.setHours(17, 0, 0, 0)

  return {
    applicationOpenAt: open.toISOString(),
    applicationCloseAt: close.toISOString(),
  }
}

export function buildOfferingDescription(programmeName: string, intakeName: string): string {
  const description = `${programmeName} is available for admission in the ${intakeName} intake cycle.`
  return description.length >= 10 ? description : `${description} Apply now.`
}
