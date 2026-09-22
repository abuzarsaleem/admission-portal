import { apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/config'
import type {
  AdmissionCriterionBatchResponse,
  AdmissionCriterionResponse,
  BulkCreateAdmissionCriteriaRequest,
  UpdateAdmissionCriterionRequest,
} from '@/lib/api/types'

export async function createOfferingCriteria(body: BulkCreateAdmissionCriteriaRequest) {
  const response = await apiPost<AdmissionCriterionBatchResponse>(`${API_ENDPOINTS.offering}/criteria`, body)
  return response.data
}

export async function listOfferingCriteria(offeringId: string) {
  const response = await apiGet<AdmissionCriterionBatchResponse>(
    `${API_ENDPOINTS.offering}/${offeringId}/criteria`,
  )
  return response.data
}

export async function updateOfferingCriterion(criteriaId: string, body: UpdateAdmissionCriterionRequest) {
  const response = await apiPatch<AdmissionCriterionResponse>(`${API_ENDPOINTS.criteria}/${criteriaId}`, body)
  return response.data
}
