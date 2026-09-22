import { apiGet, apiPatch, apiPost, apiPut } from '@/lib/api/client'
import { API_ENDPOINTS } from '@/lib/config'
import type {
  ApplicationWindowRequest,
  CreateIntakeRequest,
  IntakeListResponse,
  IntakeResponse,
  IntakeReviewPackage,
  IntakeStatusSummary,
  IntakeWorkflowResponse,
  ListIntakesParams,
  ReturnIntakeRequest,
  UpdateIntakeRequest,
} from '@/lib/api/types'

function intakeWorkflowPath(intakeId: string, action: string) {
  return `${API_ENDPOINTS.intakes}/${intakeId}/${action}`
}

export async function listIntakes(params: ListIntakesParams = {}) {
  const response = await apiGet<IntakeListResponse>(API_ENDPOINTS.intake, params)
  return response.data
}

export async function getIntakeStats() {
  const response = await apiGet<IntakeStatusSummary>(API_ENDPOINTS.intakeStats)
  return response.data
}

export async function getIntake(intakeId: string) {
  const response = await apiGet<IntakeResponse>(`${API_ENDPOINTS.intake}/${intakeId}`)
  return response.data
}

export async function createIntake(body: CreateIntakeRequest) {
  const response = await apiPost<IntakeResponse>(API_ENDPOINTS.intake, body)
  return response.data
}

export async function updateIntake(intakeId: string, body: UpdateIntakeRequest) {
  const response = await apiPatch<IntakeResponse>(`${API_ENDPOINTS.intake}/${intakeId}`, body)
  return response.data
}

export async function setApplicationWindow(intakeId: string, body: ApplicationWindowRequest) {
  const response = await apiPut<IntakeResponse>(`${API_ENDPOINTS.intake}/${intakeId}/application-window`, body)
  return response.data
}

export async function countIntakes(params: Omit<ListIntakesParams, 'page' | 'limit'> = {}) {
  const data = await listIntakes({ ...params, page: 1, limit: 1 })
  return data.meta.total
}

export async function getIntakeReview(intakeId: string) {
  const response = await apiGet<IntakeReviewPackage>(intakeWorkflowPath(intakeId, 'review'))
  return response.data
}

export async function submitIntakeForReview(intakeId: string) {
  const response = await apiPost<IntakeWorkflowResponse>(intakeWorkflowPath(intakeId, 'submit-review'), {})
  return response.data
}

export async function publishIntake(intakeId: string) {
  const response = await apiPost<IntakeWorkflowResponse>(intakeWorkflowPath(intakeId, 'publish'), {})
  return response.data
}

export async function closeIntake(intakeId: string) {
  const response = await apiPost<IntakeWorkflowResponse>(intakeWorkflowPath(intakeId, 'close'), {})
  return response.data
}

export async function returnIntakeForCorrection(intakeId: string, body: ReturnIntakeRequest) {
  const response = await apiPost<IntakeWorkflowResponse>(intakeWorkflowPath(intakeId, 'return'), body)
  return response.data
}
