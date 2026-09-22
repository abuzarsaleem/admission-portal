import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/config'
import type {
  CreateGeneralFeeRequest,
  GeneralFeeResponse,
  ListGeneralFeesParams,
  PaginatedItems,
  UpdateGeneralFeeRequest,
} from '@/lib/api/types'

export async function listGeneralFees(params: ListGeneralFeesParams = {}) {
  const response = await apiGet<PaginatedItems<GeneralFeeResponse>>(API_ENDPOINTS.generalFees, params)
  return response.data
}

export async function getGeneralFee(generalFeeId: string) {
  const response = await apiGet<GeneralFeeResponse>(`${API_ENDPOINTS.generalFees}/${generalFeeId}`)
  return response.data
}

export async function createGeneralFee(body: CreateGeneralFeeRequest) {
  const response = await apiPost<GeneralFeeResponse>(API_ENDPOINTS.generalFees, body)
  return response.data
}

export async function updateGeneralFee(generalFeeId: string, body: UpdateGeneralFeeRequest) {
  const response = await apiPatch<GeneralFeeResponse>(`${API_ENDPOINTS.generalFees}/${generalFeeId}`, body)
  return response.data
}

export async function deactivateGeneralFee(generalFeeId: string) {
  const response = await apiDelete<GeneralFeeResponse>(`${API_ENDPOINTS.generalFees}/${generalFeeId}`)
  return response.data
}

export async function countGeneralFees(params: Omit<ListGeneralFeesParams, 'page' | 'limit'> = {}) {
  const data = await listGeneralFees({ ...params, page: 1, limit: 1 })
  return data.meta.total
}
