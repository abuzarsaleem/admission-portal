function readEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]?.trim()
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

/** API origin — no trailing slash. Set via VITE_API_BASE_URL in `.env`. */
export const API_BASE_URL = readEnv('VITE_API_BASE_URL').replace(/\/$/, '')

/** Relative API paths — defined in code, combined with API_BASE_URL in the client. */
export const API_ENDPOINTS = {
  applicantIntakes: '/api/v1/applicant/admissions/intakes',
  applicantIntake: (intakeId: string) => `/api/v1/applicant/admissions/intakes/${intakeId}`,
  applicantIntakeProgrammes: (intakeId: string) =>
    `/api/v1/applicant/admissions/intakes/${intakeId}/programmes`,
  applicantOffering: (offeringId: string) =>
    `/api/v1/applicant/admissions/offerings/${offeringId}`,
  applicantOfferingCriteria: (offeringId: string) =>
    `/api/v1/applicant/admissions/offerings/${offeringId}/criteria`,
  applicantOfferingFees: (offeringId: string) =>
    `/api/v1/applicant/admissions/offerings/${offeringId}/fees`,
  applicantRegister: '/api/v1/applicants/applications/registrations',
  applicantSetPassword: '/api/v1/applicants/applications/auth/set-password',
  authLogin: '/api/v1/auth/login',
  applicationProgramme: (applicantId: string) =>
    `/api/v1/applicants/applications/${applicantId}/programme`,
  applicationAcademic: (applicantId: string) =>
    `/api/v1/applicants/applications/${applicantId}/academic`,
  applicationAcademicDocument: (applicantId: string, academicInformationId: string) =>
    `/api/v1/applicants/applications/${applicantId}/academic/${academicInformationId}/documents`,
  applicationAcademicDocumentById: (
    applicantId: string,
    academicInformationId: string,
    documentId: string,
  ) =>
    `/api/v1/applicants/applications/${applicantId}/academic/${academicInformationId}/documents/${documentId}`,
  applicationAddresses: (applicantId: string) =>
    `/api/v1/applicants/applications/${applicantId}/addresses`,
  applicationContacts: (applicantId: string) =>
    `/api/v1/applicants/applications/${applicantId}/contacts`,
  applicationProfile: (applicantId: string) =>
    `/api/v1/applicants/applications/${applicantId}/profile`,
  applicationPhotograph: (applicantId: string) =>
    `/api/v1/applicants/applications/${applicantId}/profile/photograph`,
  applicationDeclaration: (applicantId: string) =>
    `/api/v1/applicants/applications/${applicantId}/declaration`,
  applicationDeclarationTexts: (applicantId: string) =>
    `/api/v1/applicants/applications/${applicantId}/declaration/texts`,
  applicationSubmit: (applicantId: string) =>
    `/api/v1/applicants/applications/${applicantId}/submit`,
} as const
