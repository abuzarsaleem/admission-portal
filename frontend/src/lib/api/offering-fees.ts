import { apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/config'
import type {
  BulkCreateOfferingFeesRequest,
  OfferingFeeBatchResponse,
  OfferingFeeResponse,
  UpdateOfferingFeeRequest,
} from '@/lib/api/types'

export async function createOfferingFees(body: BulkCreateOfferingFeesRequest) {
  const response = await apiPost<OfferingFeeBatchResponse>(`${API_ENDPOINTS.offering}/fees`, body)
  return response.data
}

export async function listOfferingFees(offeringId: string) {
  const response = await apiGet<OfferingFeeBatchResponse>(`${API_ENDPOINTS.offering}/${offeringId}/fees`)
  return response.data
}

export async function updateOfferingFee(feeConfigurationId: string, body: UpdateOfferingFeeRequest) {
  const response = await apiPatch<OfferingFeeResponse>(`${API_ENDPOINTS.fees}/${feeConfigurationId}`, body)
  return response.data
}
