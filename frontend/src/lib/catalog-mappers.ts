import type { ApiStatus, DegreeLevel } from '@/lib/api/types'

export type UiStatus = 'Active' | 'Inactive'

export function toUiStatus(status: ApiStatus): UiStatus {
  return status === 'ACTIVE' ? 'Active' : 'Inactive'
}

export function toApiStatus(status: UiStatus | 'All'): ApiStatus | undefined {
  if (status === 'All') return undefined
  return status === 'Active' ? 'ACTIVE' : 'INACTIVE'
}

export function toUiDegreeLevel(level: DegreeLevel): string {
  switch (level) {
    case 'Bachelor':
      return 'Undergraduate'
    case 'Master':
      return 'Postgraduate'
    case 'Doctorate':
      return 'Doctorate'
    default:
      return level
  }
}

export function toApiDegreeLevel(level: string): DegreeLevel {
  if (level === 'Postgraduate' || level === 'Master') return 'Master'
  if (level === 'Doctorate') return 'Doctorate'
  return 'Bachelor'
}

export function asText(value: unknown): string {
  if (typeof value === 'string') return value
  if (value == null) return ''
  return String(value)
}
