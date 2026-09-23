import { apiGet } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/config'
import type {
  ApplicantCriterion,
  ApplicantFee,
  ApplicantIntake,
  ApplicantOffering,
  PaginatedItems,
} from '@/lib/api/types'

const publicOpts = { auth: false as const }

export async function listApplicantIntakes(params?: { page?: number; limit?: number }) {
  const response = await apiGet<PaginatedItems<ApplicantIntake>>(
    API_ENDPOINTS.applicantIntakes,
    params,
    publicOpts,
  )
  return response.data
}

export async function getApplicantIntake(intakeId: string) {
  const response = await apiGet<ApplicantIntake>(
    API_ENDPOINTS.applicantIntake(intakeId),
    undefined,
    publicOpts,
  )
  return response.data
}

export async function listApplicantProgrammes(
  intakeId: string,
  params?: { page?: number; limit?: number },
) {
  const response = await apiGet<PaginatedItems<ApplicantOffering>>(
    API_ENDPOINTS.applicantIntakeProgrammes(intakeId),
    params,
    publicOpts,
  )
  return response.data
}

export async function getApplicantOffering(offeringId: string) {
  const response = await apiGet<ApplicantOffering>(
    API_ENDPOINTS.applicantOffering(offeringId),
    undefined,
    publicOpts,
  )
  return response.data
}

export async function getApplicantOfferingCriteria(offeringId: string) {
  const response = await apiGet<ApplicantCriterion[]>(
    API_ENDPOINTS.applicantOfferingCriteria(offeringId),
    undefined,
    publicOpts,
  )
  return response.data
}

export async function getApplicantOfferingFees(offeringId: string) {
  const response = await apiGet<ApplicantFee[]>(
    API_ENDPOINTS.applicantOfferingFees(offeringId),
    undefined,
    publicOpts,
  )
  return response.data
}
