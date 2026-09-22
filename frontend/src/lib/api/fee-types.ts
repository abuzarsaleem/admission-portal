import { apiGet } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/config'
import type { FeeTypeResponse, ListCatalogueParams, PaginatedItems } from '@/lib/api/types'

export async function listFeeTypes(params: ListCatalogueParams = {}) {
  const response = await apiGet<PaginatedItems<FeeTypeResponse>>(API_ENDPOINTS.feeTypes, params)
  return response.data
}
