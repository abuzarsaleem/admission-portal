import { apiPost } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/config'
import type { LoginRequest, LoginResponse } from '@/lib/api/types'

export async function loginWithApi(credentials: LoginRequest) {
  const response = await apiPost<LoginResponse>(API_ENDPOINTS.authLogin, credentials, { auth: false })
  return response.data
}
