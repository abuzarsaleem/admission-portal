import { apiDelete, apiGet, apiPatch, apiPost } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/config'
import type {
  CreateDepartmentRequest,
  DepartmentResponse,
  ListDepartmentsParams,
  PaginatedItems,
  UpdateDepartmentRequest,
} from '@/lib/api/types'

export async function listDepartments(params: ListDepartmentsParams = {}) {
  const response = await apiGet<PaginatedItems<DepartmentResponse>>(API_ENDPOINTS.departments, params)
  return response.data
}

export async function getDepartment(departmentId: string) {
  const response = await apiGet<DepartmentResponse>(`${API_ENDPOINTS.departments}/${departmentId}`)
  return response.data
}

export async function createDepartment(body: CreateDepartmentRequest) {
  const response = await apiPost<DepartmentResponse>(API_ENDPOINTS.departments, body)
  return response.data
}

export async function updateDepartment(departmentId: string, body: UpdateDepartmentRequest) {
  const response = await apiPatch<DepartmentResponse>(`${API_ENDPOINTS.departments}/${departmentId}`, body)
  return response.data
}

export async function deactivateDepartment(departmentId: string) {
  const response = await apiDelete<DepartmentResponse>(`${API_ENDPOINTS.departments}/${departmentId}`)
  return response.data
}

export async function countDepartments(status?: ListDepartmentsParams['status']) {
  const data = await listDepartments({ page: 1, limit: 1, status })
  return data.meta.total
}
