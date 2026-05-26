import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

import { DashboardSummary, DashboardSummaryRaw } from '../model/types'

function normalize(raw: DashboardSummaryRaw): DashboardSummary {
  return {
    totalEmployees: raw.total_employees,
    totalTeams: raw.total_teams,
    employeesByRiskLevel: raw.employees_by_risk_level,
    overloadedEmployeesCount: raw.overloaded_employees_count,
    outdatedSchedulesCount: raw.outdated_schedules_count,
    outsideScheduleEventsCount: raw.outside_schedule_events_count,
    averageActualityScore: raw.average_actuality_score ?? 0,
    conflictsTotal: raw.conflicts_total ?? raw.outside_schedule_events_count,
    outdatedSchedulesDelta: raw.outdated_schedules_delta ?? 0,
    averageActualityScoreDelta: raw.average_actuality_score_delta ?? 0,
    conflictsDelta: raw.conflicts_delta ?? 0,
    lastCalculationAt: raw.last_calculation_at,
    averageRiskScore: raw.average_risk_score ?? 0,
    averageRiskScoreDelta: raw.average_risk_score_delta ?? 0,
    conflictsRate: raw.conflicts_rate ?? 0,
    conflictsRateDelta: raw.conflicts_rate_delta ?? 0,
    teamSize: raw.team_size ?? raw.total_employees,
    averageActualityScoreHistory: raw.average_actuality_score_history ?? [],
  }
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const data = await apiClient<DashboardSummaryRaw>('GET', API_URLS.dashboardSummary())
  return normalize(data)
}
