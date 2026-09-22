import { apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/config'
import type {
  CreateOfferingRequest,
  ListOfferingsParams,
  OfferingResponse,
  PaginatedItems,
  UpdateOfferingRequest,
} from '@/lib/api/types'

export async function listOfferings(intakeId: string, params: ListOfferingsParams = {}) {
  const response = await apiGet<PaginatedItems<OfferingResponse>>(
    `${API_ENDPOINTS.intakes}/${intakeId}/offerings`,
    params,
  )
  return response.data
}

export async function createOffering(intakeId: string, body: CreateOfferingRequest) {
  const response = await apiPost<OfferingResponse>(`${API_ENDPOINTS.intakes}/${intakeId}/offerings`, body)
  return response.data
}

export async function updateOffering(offeringId: string, body: UpdateOfferingRequest) {
  const response = await apiPatch<OfferingResponse>(`${API_ENDPOINTS.offering}/${offeringId}`, body)
  return response.data
}
