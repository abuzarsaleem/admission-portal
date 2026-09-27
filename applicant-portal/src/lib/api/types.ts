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

export type RegisterApplicantRequest = {
  intakeSessionId: string
  applicantName: string
  registeredEmail: string
  mobileNumber: string
  cnicNumber?: string
  passportNumber?: string
}

export type RegistrationResponse = {
  applicantId: string
  applicationId: string
  applicationReference: string
  intakeSessionId: string
  applicationStatus: string
  overallCompletion: number
  iamOnboardStatus: string
  verificationEmailSent: boolean
}

export type SetApplicantPasswordRequest = {
  token: string
  password: string
}

export type SetApplicantPasswordResponse = {
  userId: string
  email: string
  verified: boolean
  applicantId?: string
}

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

export type QualificationLevel = 'UNDERGRADUATE' | 'POSTGRADUATE' | 'PHD'

export type ProgrammeOptionInput = {
  programmeOfferingId: string
  preferenceOrder: number
}

export type ProgrammeOptionResponse = {
  id: string
  programmeOfferingId: string
  preferenceOrder: number
}

export type ProgrammeStepResponse = {
  applicantId: string
  intakeSessionId: string
  qualificationLevel: QualificationLevel | null
  appliedDate: string | null
  stepSaved: boolean
  savedAt: string | null
  options: ProgrammeOptionResponse[]
  programmeStepSaved: boolean
  overallCompletion: number
}

export type SaveProgrammeRequest = {
  qualificationLevel: QualificationLevel
  options: ProgrammeOptionInput[]
}

export type AcademicDocumentType = 'CERTIFICATE' | 'MARKSHEET' | 'TRANSCRIPT'

export type AcademicRecordFields = {
  degreeType: string
  rollNumber: string
  qualificationName: string
  boardOrInstitution: string
  passingYear: string
  division: string
  grade: string
  marksOrGpaObtained: string
  marksOrGpaTotal: string
  percentage: number
}

export type AcademicDocumentResponse = {
  id: string
  academicInformationId: string
  documentType: AcademicDocumentType
  fileReference: string
  downloadUrl: string
  originalFileName: string | null
  mimeType: string | null
  fileSize: number | null
  uploadedAt: string
  verificationStatus: string
}

export type AcademicRecordResponse = AcademicRecordFields & {
  id: string
  rollNumber: string | null
  documents: AcademicDocumentResponse[]
  createdAt: string
  updatedAt: string
}

export type AcademicStepResponse = {
  applicantId: string
  academicStepSaved: boolean
  overallCompletion: number
  records: AcademicRecordResponse[]
}

export type SaveAcademicRequest = {
  records: AcademicRecordFields[]
}

export type UpdateAcademicRequest = {
  records: Array<AcademicRecordFields & { id: string }>
}

export type AddressType = 'PRIMARY' | 'SECONDARY'

export type AddressFields = {
  addressType: AddressType
  addressLine1: string
  addressLine2?: string
  countryId: string
  provinceId: string
  cityId: string
  postalCode?: string
  isSameAsPrimary?: boolean
}

export type ApplicationAddressResponse = AddressFields & {
  id: string
  addressLine2: string | null
  postalCode: string | null
  isSameAsPrimary: boolean
}

export type ContactType = 'PARENT' | 'GUARDIAN' | 'EMERGENCY'

export type ContactFields = {
  contactType: ContactType
  name: string
  identityDocumentNumber?: string
  relationship: string
  occupation?: string
  mobileNumber: string
  telephone?: string
  email?: string
  addressLine?: string
}

export type ApplicationContactResponse = ContactFields & {
  id: string
  identityDocumentNumber: string | null
  occupation: string | null
  telephone: string | null
  email: string | null
  addressLine: string | null
}

export type SaveProfileRequest = {
  applicantName: string
  gender: string
  maritalStatus: string
  dateOfBirth: string
  mobileNumber: string
  telephone?: string
  primaryNationalityId: string
  secondaryNationalityId?: string
  domicileId?: string
  disabilityDeclared: boolean
  referralSource?: string
}

export type ProfileStepResponse = {
  applicantId: string
  applicantName: string
  gender: string | null
  maritalStatus: string | null
  dateOfBirth: string | null
  mobileNumber: string
  telephone: string | null
  profilePhotograph: string | null
  profilePhotographDownloadUrl: string | null
  primaryNationalityId: string | null
  secondaryNationalityId: string | null
  domicileId: string | null
  disabilityDeclared: boolean | null
  referralSource: string | null
  addresses: ApplicationAddressResponse[]
  contacts: ApplicationContactResponse[]
  profileStepSaved: boolean
  overallCompletion: number
}

export type ProfilePhotographResponse = {
  applicantId: string
  profilePhotograph: string
  downloadUrl: string
}

export type OfferingDeclarationText = {
  id: string
  programmeOfferingId: string
  declarationTypeId: string
  declarationText: string
  version: string
  effectiveFrom?: string
  effectiveTo?: string | null
}

export type SaveDeclarationRequest = {
  declarationAccepted: boolean
  acceptedOfferingDeclarationIds: string[]
  disciplinaryIssueDeclared: boolean
  disciplinaryIssueDetails?: string
}

export type DeclarationStepResponse = {
  applicantId: string
  declarationAccepted: boolean
  declarationAcceptanceDate: string | null
  declarationVersion: string | null
  acceptedOfferingDeclarationIds: string[]
  disciplinaryIssueDeclared: boolean
  disciplinaryIssueDetails: string | null
  submissionDate: string | null
  declarationStepSaved: boolean
  overallCompletion: number
  applicationStatus: string
}

export type SubmitApplicationResponse = {
  applicantId: string
  applicationStatus: string
  overallCompletion: number
  submissionDate: string
}

export type ApplicationStepId =
  | 'programme'
  | 'academic'
  | 'profile'
  | 'declaration'
  | 'review'

