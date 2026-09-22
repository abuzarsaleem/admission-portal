import { apiGet } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/config'
import type { CriteriaTypeResponse, ListCatalogueParams, PaginatedItems } from '@/lib/api/types'

export async function listCriteriaTypes(params: ListCatalogueParams = {}) {
  const response = await apiGet<PaginatedItems<CriteriaTypeResponse>>(API_ENDPOINTS.criteriaTypes, params)
  return response.data
}
