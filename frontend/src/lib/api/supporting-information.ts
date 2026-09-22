import { apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/config'
import type {
  BulkCreateSupportingInformationRequest,
  SupportingInformationBatchResponse,
  SupportingInformationResponse,
  UpdateSupportingInformationRequest,
} from '@/lib/api/types'

export async function createOfferingSupportingInformation(body: BulkCreateSupportingInformationRequest) {
  const response = await apiPost<SupportingInformationBatchResponse>(
    `${API_ENDPOINTS.offering}/supporting-information`,
    body,
  )
  return response.data
}

export async function listOfferingSupportingInformation(offeringId: string) {
  const response = await apiGet<SupportingInformationBatchResponse>(
    `${API_ENDPOINTS.offering}/${offeringId}/supporting-information`,
  )
  return response.data
}

export async function updateSupportingInformation(informationId: string, body: UpdateSupportingInformationRequest) {
  const response = await apiPatch<SupportingInformationResponse>(
    `${API_ENDPOINTS.supportingInformation}/${informationId}`,
    body,
  )
  return response.data
}
