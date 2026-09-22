import { apiGet } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/config'
import type { DepartmentsProgrammesStats } from '@/lib/api/types'

export async function getDepartmentsProgrammesStats() {
  const response = await apiGet<DepartmentsProgrammesStats>(API_ENDPOINTS.departmentsProgrammesStats)
  return response.data
}
