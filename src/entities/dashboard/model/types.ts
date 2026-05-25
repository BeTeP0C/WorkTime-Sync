import { RiskLevel } from '@/entities/employee/model/types'

export interface DashboardSummaryRaw {
  total_employees: number
  total_teams: number
  employees_by_risk_level: Record<RiskLevel, number>
  overloaded_employees_count: number
  outdated_schedules_count: number
  outside_schedule_events_count: number
  last_calculation_at: string | null
  // расширения мока — фронт-фичи (тренды/средний Ai)
  average_actuality_score?: number
  conflicts_total?: number
  outdated_schedules_delta?: number
  average_actuality_score_delta?: number
  conflicts_delta?: number
  total_employees_teams_count?: number
}

export interface DashboardSummary {
  totalEmployees: number
  totalTeams: number
  employeesByRiskLevel: Record<RiskLevel, number>
  overloadedEmployeesCount: number
  outdatedSchedulesCount: number
  outsideScheduleEventsCount: number
  averageActualityScore: number
  conflictsTotal: number
  outdatedSchedulesDelta: number
  averageActualityScoreDelta: number
  conflictsDelta: number
  lastCalculationAt: string | null
}
