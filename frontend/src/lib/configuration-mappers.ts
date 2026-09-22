import type { CriteriaOperator, FeeStatus } from '@/lib/api/types'
import { asText } from '@/lib/catalog-mappers'

export const criteriaOperatorOptions: { value: CriteriaOperator; label: string }[] = [
  { value: 'EQUALS', label: 'Equals' },
  { value: 'GREATER_THAN', label: 'Greater than' },
  { value: 'GREATER_THAN_OR_EQUAL', label: 'Greater than or equal' },
  { value: 'LESS_THAN', label: 'Less than' },
  { value: 'REQUIRED', label: 'Required' },
  { value: 'BETWEEN', label: 'Between' },
]

export function toUiCriteriaOperator(operator: CriteriaOperator | null | undefined): string {
  if (!operator) return '—'
  return criteriaOperatorOptions.find(option => option.value === operator)?.label ?? operator
}

export function toUiMandatory(mandatory: boolean): 'Yes' | 'No' {
  return mandatory ? 'Yes' : 'No'
}

export function toApiMandatory(value: string): boolean {
  return value === 'Yes'
}

export type UiFeeStatus = 'Active' | 'Inactive' | 'Retired'

export function toUiFeeStatus(status: FeeStatus): UiFeeStatus {
  switch (status) {
    case 'ACTIVE':
      return 'Active'
    case 'INACTIVE':
      return 'Inactive'
    case 'RETIRED':
      return 'Retired'
    default:
      return 'Inactive'
  }
}

export function toApiFeeStatus(status: UiFeeStatus | 'All'): FeeStatus | undefined {
  if (status === 'All') return undefined
  switch (status) {
    case 'Active':
      return 'ACTIVE'
    case 'Inactive':
      return 'INACTIVE'
    case 'Retired':
      return 'RETIRED'
    default:
      return undefined
  }
}

export function formatFeeTypeLabel(feeType: string): string {
  return feeType
    .split('_')
    .map(part => part.charAt(0) + part.slice(1).toLowerCase())
    .join(' ')
}

export function formatAmount(amount: string | number): string {
  const numeric = typeof amount === 'number' ? amount : Number(amount)
  if (Number.isNaN(numeric)) return String(amount)
  return numeric.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export function criteriaDisplayName(criteriaName: unknown, fallback: string): string {
  const label = asText(criteriaName).trim()
  return label || fallback
}
