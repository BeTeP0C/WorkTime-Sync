import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

import {
  ActualityHistoryPoint,
  ActualityHistoryPointRaw,
  RiskDistributionPoint,
  RiskDistributionPointRaw,
  SummaryDeltas,
  SummaryDeltasRaw,
  TeamMetricsHistoryPoint,
  TeamMetricsHistoryPointRaw,
  TeamRatingItem,
  TeamRatingItemRaw,
} from '../model/types'

export async function getActualityHistory(months = 6): Promise<ActualityHistoryPoint[]> {
  const data = await apiClient<ActualityHistoryPointRaw[]>(
    'GET',
    API_URLS.analyticsActualityHistory(months)
  )
  return data.map((point) => ({ month: point.month, value: point.value }))
}

export async function getRiskDistributionHistory(months = 6): Promise<RiskDistributionPoint[]> {
  const data = await apiClient<RiskDistributionPointRaw[]>(
    'GET',
    API_URLS.analyticsRiskDistributionHistory(months)
  )
  return data.map((point) => ({
    month: point.month,
    low: point.low,
    medium: point.medium,
    high: point.high,
    critical: point.critical,
  }))
}

export async function getTeamRating(limit = 10): Promise<TeamRatingItem[]> {
  const data = await apiClient<TeamRatingItemRaw[]>('GET', API_URLS.analyticsTeamRating(limit))
  return data.map((item) => ({
    teamId: item.team_id,
    name: item.name,
    membersCount: item.members_count,
    avgActuality: item.avg_actuality,
    avgRiskScore: item.avg_risk_score,
    attentionCount: item.attention_count,
  }))
}

export async function getSummaryDeltas(period: 'month' | 'week' = 'month'): Promise<SummaryDeltas> {
  const data = await apiClient<SummaryDeltasRaw>('GET', API_URLS.analyticsSummaryDeltas(period))
  return {
    period: data.period,
    aiDelta: data.ai_delta,
    ciDelta: data.ci_delta,
    outdatedSchedulesDelta: data.outdated_schedules_delta,
  }
}

export async function getTeamMetricsHistory(
  teamId: string,
  months = 6
): Promise<TeamMetricsHistoryPoint[]> {
  const data = await apiClient<TeamMetricsHistoryPointRaw[]>(
    'GET',
    API_URLS.analyticsTeamMetricsHistory(teamId, months)
  )
  return data.map((point) => ({
    month: point.month,
    avgActuality: point.avg_actuality,
    avgRiskScore: point.avg_risk_score,
    attentionCount: point.attention_count,
  }))
}
