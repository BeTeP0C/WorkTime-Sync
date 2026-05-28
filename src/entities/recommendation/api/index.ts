import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

import {
  Recommendation,
  RECOMMENDATION_TITLE_RU,
  RecommendationRaw,
  RecommendationSeverity,
  RecommendationSubject,
  RecommendationTargetStatus,
} from '../model/types'

export function normalizeRecommendation(raw: RecommendationRaw): Recommendation {
  return {
    code: raw.code,
    reason: raw.reason,
    severity: raw.severity,
    action: raw.action,
    subjectType: raw.subject_type,
    subjectId: raw.subject_id,
    title: RECOMMENDATION_TITLE_RU[raw.code] ?? raw.action,
    status: raw.status ?? null,
    roadmapItemId: raw.roadmap_item_id ?? null,
  }
}

export async function getRecommendations(): Promise<Recommendation[]> {
  const data = await apiClient<RecommendationRaw[]>('GET', API_URLS.recommendations())
  return data.map(normalizeRecommendation)
}

export async function getEmployeeRecommendations(employeeId: string): Promise<Recommendation[]> {
  const data = await apiClient<RecommendationRaw[]>(
    'GET',
    API_URLS.employeeRecommendations(employeeId)
  )
  return data.map(normalizeRecommendation)
}

export async function patchRecommendationStatus(
  code: string,
  subjectType: RecommendationSubject,
  subjectId: string,
  status: RecommendationTargetStatus
): Promise<Recommendation> {
  const data = await apiClient<RecommendationRaw>(
    'PATCH',
    API_URLS.recommendationStatus(code, subjectType, subjectId),
    { body: { status } }
  )
  return normalizeRecommendation(data)
}

interface BulkStatusRequest {
  status: RecommendationTargetStatus
  severity?: RecommendationSeverity
  subjectType?: RecommendationSubject
}

export interface BulkStatusResponse {
  updated: number
  skipped: number
}

export async function bulkUpdateRecommendationStatus(
  payload: BulkStatusRequest
): Promise<BulkStatusResponse> {
  return apiClient<BulkStatusResponse>('POST', API_URLS.recommendationsBulkStatus(), {
    body: {
      status: payload.status,
      severity: payload.severity,
      subject_type: payload.subjectType,
    },
  })
}
