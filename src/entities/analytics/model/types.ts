import { RiskLevel } from '@/entities/employee/model/types'

export interface ActualityHistoryPointRaw {
  month: string
  value: number
}

export interface RiskDistributionPointRaw {
  month: string
  low: number
  medium: number
  high: number
  critical: number
}

export interface TeamRatingItemRaw {
  team_id: string
  name: string
  members_count: number
  avg_actuality: number
  avg_risk_score: number
  attention_count: number
}

export interface SummaryDeltasRaw {
  period: 'month' | 'week'
  ai_delta: number
  ci_delta: number
  outdated_schedules_delta: number
}

export interface ActualityHistoryPoint {
  month: string
  value: number
}

export interface RiskDistributionPoint extends Record<RiskLevel, number> {
  month: string
}

export interface TeamRatingItem {
  teamId: string
  name: string
  membersCount: number
  avgActuality: number
  avgRiskScore: number
  attentionCount: number
}

export interface SummaryDeltas {
  period: 'month' | 'week'
  aiDelta: number
  ciDelta: number
  outdatedSchedulesDelta: number
}

export interface TeamMetricsHistoryPointRaw {
  month: string
  avg_actuality: number
  avg_risk_score: number
  attention_count: number
}

export interface TeamMetricsHistoryPoint {
  month: string
  avgActuality: number
  avgRiskScore: number
  attentionCount: number
}
