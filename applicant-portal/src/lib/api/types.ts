export type ApiSuccessResponse<T> = {
  success: true
  data: T
}

export type ApiErrorResponse = {
  success: false
  statusCode: number
  code: string
  message: string | string[]
  path: string
  timestamp: string
}

export type PaginationMeta = {
  page: number
  limit: number
  total: number
  totalPages: number
}

export type PaginatedItems<T> = {
  items: T[]
  meta: PaginationMeta
}

export type ApplicantIntake = {
  id: string
  intakeName: string
  intakeCode: string
  applicationOpenAt: string
  applicationCloseAt: string
  publishedAt: string | null
}

export type ApplicantProgrammeSummary = {
  id: string
  code: string
  name: string
  degreeLevel: string
  programmeGrouping: string | null
}

export type ApplicantOffering = {
  id: string
  intakeId: string
  programmeId: string
  programme: ApplicantProgrammeSummary
  publishedDescription: string
  displayOrder: number | null
  publishedAt: string | null
}

export type ApplicantCriterion = {
  id: string
  criteriaTypeId: string
  criteriaName: string | null
  criteriaRequirement: string
  criteriaOperator: string | null
  criteriaUnit: string | null
  mandatory: boolean
  sequenceNo: number | null
}

export type ApplicantFee = {
  id: string
  feeType: string
  amount: string
  currency: string
  effectiveFrom: string | null
  effectiveTo: string | null
  sortOrder: number | null
}

export type ApplicantWindowStatus = 'open' | 'upcoming' | 'closed'
