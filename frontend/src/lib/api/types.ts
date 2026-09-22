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

export type ApiStatus = 'ACTIVE' | 'INACTIVE'

export type DegreeLevel = 'Bachelor' | 'Master' | 'Doctorate'

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  access_token: string
  user_id: string
  tenant_id: string
  email: string
  roles: string[]
}

export type DepartmentResponse = {
  id: string
  tenantId: string
  code: string
  name: string
  description: unknown
  status: ApiStatus
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export type CreateDepartmentRequest = {
  code: string
  name: string
  description?: string | null
}

export type UpdateDepartmentRequest = {
  code?: string
  name?: string
  description?: string | null
  status?: ApiStatus
}

export type ProgrammeResponse = {
  id: string
  tenantId: string
  departmentId: string
  code: string
  name: string
  description: unknown
  programmeGrouping: unknown
  curriculumReference: unknown
  degreeLevel: DegreeLevel
  status: ApiStatus
  sortOrder: number | null
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export type CreateProgrammeRequest = {
  departmentId: string
  code: string
  name: string
  description?: string | null
  programmeGrouping?: string | null
  curriculumReference?: string | null
  degreeLevel: DegreeLevel
  sortOrder?: number | null
}

export type UpdateProgrammeRequest = {
  departmentId?: string
  code?: string
  name?: string
  description?: string | null
  programmeGrouping?: string | null
  curriculumReference?: string | null
  degreeLevel?: DegreeLevel
  status?: ApiStatus
  sortOrder?: number | null
}

export type ListDepartmentsParams = {
  page?: number
  limit?: number
  status?: ApiStatus
}

export type ListProgrammesParams = {
  page?: number
  limit?: number
  status?: ApiStatus
  departmentId?: string
}

export type CriteriaValueDataType = 'TEXT' | 'NUMBER' | 'BOOLEAN' | 'DATE' | 'PERCENTAGE'

export type CriteriaOperator =
  | 'EQUALS'
  | 'GREATER_THAN'
  | 'GREATER_THAN_OR_EQUAL'
  | 'LESS_THAN'
  | 'REQUIRED'
  | 'BETWEEN'

export type FeeStatus = 'ACTIVE' | 'INACTIVE' | 'RETIRED'

export type CriteriaTypeResponse = {
  id: string
  code: string
  name: string
  description: unknown
  valueDataType: CriteriaValueDataType
  status: ApiStatus
  sortOrder: number | null
  createdAt: string
  updatedAt: string
}

export type FeeTypeResponse = {
  id: string
  name: string
}

export type GeneralCriterionResponse = {
  id: string
  tenantId: string
  criteriaTypeId: string
  criteriaName: unknown
  criteriaRequirement: string
  criteriaOperator: CriteriaOperator | null
  criteriaUnit: unknown
  mandatory: boolean
}

export type CreateGeneralCriterionRequest = {
  criteriaTypeId: string
  criteriaName?: string | null
  criteriaRequirement: string
  criteriaOperator?: CriteriaOperator | null
  criteriaUnit?: string | null
  mandatory?: boolean
}

export type UpdateGeneralCriterionRequest = {
  criteriaName?: string | null
  criteriaRequirement?: string
  criteriaOperator?: CriteriaOperator | null
  criteriaUnit?: string | null
  mandatory?: boolean
}

export type GeneralFeeResponse = {
  id: string
  tenantId: string
  feeType: string
  amount: string
  currency: string
  status: FeeStatus
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export type CreateGeneralFeeRequest = {
  feeType: string
  amount: number
  currency: string
}

export type UpdateGeneralFeeRequest = {
  amount?: number
  currency?: string
  status?: FeeStatus
}

export type ListGeneralCriteriaParams = {
  page?: number
  limit?: number
  criteriaTypeId?: string
}

export type ListGeneralFeesParams = {
  page?: number
  limit?: number
  status?: FeeStatus
  feeType?: string
}

export type ListCatalogueParams = {
  page?: number
  limit?: number
}

export type IntakeStatus =
  | 'DRAFT'
  | 'CONFIGURED'
  | 'UNDER_REVIEW'
  | 'PUBLISHED'
  | 'CLOSED'

export type OfferingStatus = 'DRAFT' | 'CONFIGURED' | 'UNDER_REVIEW' | 'PUBLISHED' | 'CLOSED'

export type IntakeResponse = {
  id: string
  tenantId: string
  intakeName: string
  intakeCode: string
  status: IntakeStatus
  applicationOpenAt: string
  applicationCloseAt: string
  publishedAt: unknown
  publishedBy: unknown
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export type CreateIntakeRequest = {
  intakeName: string
  intakeCode: string
  applicationOpenAt: string
  applicationCloseAt: string
}

export type UpdateIntakeRequest = {
  intakeName?: string
  intakeCode?: string
}

export type ApplicationWindowRequest = {
  applicationOpenAt: string
  applicationCloseAt: string
}

export type ListIntakesParams = {
  page?: number
  limit?: number
  status?: IntakeStatus
}

export type IntakeStatusSummary = {
  total: number
  draft: number
  configured: number
  underReview: number
  published: number
  closed: number
}

export type IntakeListResponse = {
  items: IntakeResponse[]
  meta: PaginationMeta
  summary: IntakeStatusSummary
}

export type OfferingResponse = {
  id: string
  tenantId: string
  intakeId: string
  programmeId: string
  offeringStatus: OfferingStatus
  displayOrder: number | null
  publishedDescription: string
  publishedAt: unknown
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export type CreateOfferingRequest = {
  programmeId: string
  publishedDescription: string
  displayOrder?: number | null
}

export type UpdateOfferingRequest = {
  publishedDescription?: string
  displayOrder?: number | null
}

export type ListOfferingsParams = {
  page?: number
  limit?: number
}

export type AdmissionCriterionResponse = {
  id: string
  tenantId: string
  programmeOfferingId: string
  generalCriteriaId: string
  criteriaTypeId: string
  criteriaName: unknown
  criteriaRequirement: string
  criteriaOperator: CriteriaOperator | null
  criteriaUnit: unknown
  mandatory: boolean
  sequenceNo: number | null
  effectiveFrom: unknown
  effectiveTo: unknown
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export type CreateAdmissionCriterionItemRequest = {
  generalCriteriaId?: string
  criteriaTypeId?: string
  criteriaName?: string | null
  criteriaRequirement?: string
  criteriaOperator?: CriteriaOperator | null
  criteriaUnit?: string | null
  mandatory?: boolean
  sequenceNo?: number | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
}

export type BulkCreateAdmissionCriteriaRequest = {
  offeringIds: string[]
  criteria: CreateAdmissionCriterionItemRequest[]
}

export type AdmissionCriterionBatchResponse = {
  items: AdmissionCriterionResponse[]
}

export type UpdateAdmissionCriterionRequest = {
  criteriaName?: string | null
  criteriaRequirement?: string
  criteriaOperator?: CriteriaOperator | null
  criteriaUnit?: string | null
  mandatory?: boolean
  sequenceNo?: number | null
  effectiveFrom?: string | null
  effectiveTo?: string | null
}

export type OfferingFeeResponse = {
  id: string
  tenantId: string
  programmeOfferingId: string
  generalFeeId: string
  feeType: string
  amount: string
  currency: string
  status: FeeStatus
  effectiveFrom: unknown
  effectiveTo: unknown
  sortOrder: number | null
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export type CreateOfferingFeeItemRequest = {
  generalFeeId?: string
  feeType?: string
  amount?: number
  currency?: string
  effectiveFrom?: string | null
  effectiveTo?: string | null
  sortOrder?: number | null
}

export type BulkCreateOfferingFeesRequest = {
  offeringIds: string[]
  fees: CreateOfferingFeeItemRequest[]
}

export type OfferingFeeBatchResponse = {
  items: OfferingFeeResponse[]
}

export type UpdateOfferingFeeRequest = {
  amount?: number
  currency?: string
  status?: FeeStatus
  effectiveFrom?: string | null
  effectiveTo?: string | null
  sortOrder?: number | null
}

export type SupportingInformationType = 'FAQ' | 'NOTE' | 'INSTRUCTION' | 'CONTACT' | 'OTHER'

export type SupportingInformationStatus = 'ACTIVE' | 'INACTIVE'

export type SupportingInformationResponse = {
  id: string
  tenantId: string
  programmeOfferingId: string
  informationType: SupportingInformationType
  title: string
  content: string
  referenceUrl: unknown
  mandatory: boolean
  displayOrder: number | null
  status: SupportingInformationStatus
  createdAt: string
  createdBy: string
  updatedAt: string
  updatedBy: string
}

export type CreateSupportingInformationItemRequest = {
  informationType: SupportingInformationType
  title: string
  content: string
  referenceUrl?: string | null
  mandatory?: boolean
  displayOrder?: number | null
}

export type BulkCreateSupportingInformationRequest = {
  offeringIds: string[]
  items: CreateSupportingInformationItemRequest[]
}

export type SupportingInformationBatchResponse = {
  items: SupportingInformationResponse[]
}

export type UpdateSupportingInformationRequest = {
  informationType?: SupportingInformationType
  title?: string
  content?: string
  referenceUrl?: string | null
  mandatory?: boolean
  displayOrder?: number | null
  status?: SupportingInformationStatus
}

export type IntakeReviewOffering = {
  offeringId: string
  programmeId: string
  offeringStatus: string
  publishedDescription: string
  criteriaCount: number
  activeFeeCount: number
  supportingInformationCount: number
  missingMandatorySupportingInfo: number
}

export type PublicationReadinessIssue = {
  code: string
  message: string
  offeringId: unknown
}

export type PublicationReadiness = {
  ready: boolean
  issues: PublicationReadinessIssue[]
}

export type IntakeReviewPackage = {
  intake: IntakeResponse
  readiness: PublicationReadiness
  offerings: IntakeReviewOffering[]
}

export type ReturnIntakeRequest = {
  reason: string
}

export type IntakeWorkflowResponse = {
  intake: IntakeResponse
  previousStatus: IntakeStatus
  currentStatus: IntakeStatus
  note: unknown
}
