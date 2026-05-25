import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

import { Recommendation, RECOMMENDATION_TITLE_RU, RecommendationRaw } from '../model/types'

function normalize(raw: RecommendationRaw): Recommendation {
  return {
    code: raw.code,
    reason: raw.reason,
    severity: raw.severity,
    action: raw.action,
    subjectType: raw.subject_type,
    subjectId: raw.subject_id,
    title: RECOMMENDATION_TITLE_RU[raw.code] ?? raw.action,
  }
}

export async function getRecommendations(): Promise<Recommendation[]> {
  const data = await apiClient<RecommendationRaw[]>('GET', API_URLS.recommendations())
  return data.map(normalize)
}

export async function getEmployeeRecommendations(employeeId: string): Promise<Recommendation[]> {
  const data = await apiClient<RecommendationRaw[]>(
    'GET',
    API_URLS.employeeRecommendations(employeeId)
  )
  return data.map(normalize)
}
