import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/config'
import type {
  CreateGeneralCriterionRequest,
  GeneralCriterionResponse,
  ListGeneralCriteriaParams,
  PaginatedItems,
  UpdateGeneralCriterionRequest,
} from '@/lib/api/types'

export async function listGeneralCriteria(params: ListGeneralCriteriaParams = {}) {
  const response = await apiGet<PaginatedItems<GeneralCriterionResponse>>(API_ENDPOINTS.generalCriteria, params)
  return response.data
}

export async function getGeneralCriterion(generalCriteriaId: string) {
  const response = await apiGet<GeneralCriterionResponse>(`${API_ENDPOINTS.generalCriteria}/${generalCriteriaId}`)
  return response.data
}

export async function createGeneralCriterion(body: CreateGeneralCriterionRequest) {
  const response = await apiPost<GeneralCriterionResponse>(API_ENDPOINTS.generalCriteria, body)
  return response.data
}

export async function updateGeneralCriterion(generalCriteriaId: string, body: UpdateGeneralCriterionRequest) {
  const response = await apiPatch<GeneralCriterionResponse>(
    `${API_ENDPOINTS.generalCriteria}/${generalCriteriaId}`,
    body,
  )
  return response.data
}

export async function deleteGeneralCriterion(generalCriteriaId: string) {
  const response = await apiDelete<GeneralCriterionResponse>(`${API_ENDPOINTS.generalCriteria}/${generalCriteriaId}`)
  return response.data
}

export async function countGeneralCriteria(params: Omit<ListGeneralCriteriaParams, 'page' | 'limit'> = {}) {
  const data = await listGeneralCriteria({ ...params, page: 1, limit: 1 })
  return data.meta.total
}
