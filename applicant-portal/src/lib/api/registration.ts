import { apiPost } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/config'
import type {
  RegisterApplicantRequest,
  RegistrationResponse,
  SetApplicantPasswordRequest,
  SetApplicantPasswordResponse,
} from '@/lib/api/types'

const publicOpts = { auth: false as const }

export async function registerApplicant(body: RegisterApplicantRequest) {
  const response = await apiPost<RegistrationResponse, RegisterApplicantRequest>(
    API_ENDPOINTS.applicantRegister,
    body,
    publicOpts,
  )
  return response.data
}

export async function setApplicantPassword(body: SetApplicantPasswordRequest) {
  const response = await apiPost<SetApplicantPasswordResponse, SetApplicantPasswordRequest>(
    API_ENDPOINTS.applicantSetPassword,
    body,
    publicOpts,
  )
  return response.data
}
