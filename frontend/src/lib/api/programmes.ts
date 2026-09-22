import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/config'
import type {
  CreateProgrammeRequest,
  ListProgrammesParams,
  PaginatedItems,
  ProgrammeResponse,
  UpdateProgrammeRequest,
} from '@/lib/api/types'

export async function listProgrammes(params: ListProgrammesParams = {}) {
  const response = await apiGet<PaginatedItems<ProgrammeResponse>>(API_ENDPOINTS.programmes, params)
  return response.data
}

export async function getProgramme(programmeId: string) {
  const response = await apiGet<ProgrammeResponse>(`${API_ENDPOINTS.programmes}/${programmeId}`)
  return response.data
}

export async function createProgramme(body: CreateProgrammeRequest) {
  const response = await apiPost<ProgrammeResponse>(API_ENDPOINTS.programmes, body)
  return response.data
}

export async function updateProgramme(programmeId: string, body: UpdateProgrammeRequest) {
  const response = await apiPatch<ProgrammeResponse>(`${API_ENDPOINTS.programmes}/${programmeId}`, body)
  return response.data
}

export async function deactivateProgramme(programmeId: string) {
  const response = await apiDelete<ProgrammeResponse>(`${API_ENDPOINTS.programmes}/${programmeId}`)
  return response.data
}

export async function countProgrammes(params: Omit<ListProgrammesParams, 'page' | 'limit'> = {}) {
  const data = await listProgrammes({ ...params, page: 1, limit: 1 })
  return data.meta.total
}
