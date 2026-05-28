import { normalizeEmployee } from '@/entities/employee/lib/normalize'

import {
  AvailabilityWindow,
  AvailabilityWindowRaw,
  EmployeeAvailability,
  EmployeeAvailabilityRaw,
  MeetingRecommendation,
  MeetingRecommendationRaw,
  normalizeTeamRole,
  Team,
  TeamAvailability,
  TeamAvailabilityRaw,
  TeamMember,
  TeamMemberRaw,
  TeamMetrics,
  TeamMetricsRaw,
  TeamRaw,
} from '../model/types'

export function getTeamInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase()
  }
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export function normalizeTeamMember(raw: TeamMemberRaw): TeamMember {
  return {
    employeeId: raw.employee_id,
    role: normalizeTeamRole(raw.role_in_team),
    employee: raw.employee ? normalizeEmployee(raw.employee) : undefined,
  }
}

export function normalizeTeam(raw: TeamRaw): Team {
  const members = (raw.members ?? []).map(normalizeTeamMember)
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? '',
    avatarUrl: raw.avatar_url ?? null,
    initials: getTeamInitials(raw.name),
    members,
    membersCount: raw.members_count ?? (raw.members ? members.length : null),
  }
}

export function normalizeTeamMetrics(raw: TeamMetricsRaw): TeamMetrics {
  return {
    teamId: raw.team_id,
    membersCount: raw.members_count,
    attentionCount: raw.attention_count,
    outdatedCount: raw.outdated_count,
    avgActuality: raw.avg_actuality,
    avgLoad: raw.avg_load,
    maxRiskLevel: raw.max_risk_level,
  }
}

function normalizeWindow(w: AvailabilityWindowRaw): AvailabilityWindow {
  return { startDt: w.start_dt, endDt: w.end_dt }
}

function normalizeEmployeeAvailability(raw: EmployeeAvailabilityRaw): EmployeeAvailability {
  return {
    employeeId: raw.employee_id,
    timezone: raw.timezone,
    availableWindows: raw.available_windows.map(normalizeWindow),
    busyWindows: (raw.busy_windows ?? []).map(normalizeWindow),
    conflictWindows: (raw.conflict_windows ?? []).map(normalizeWindow),
    outOfScheduleWindows: (raw.out_of_schedule_windows ?? []).map(normalizeWindow),
  }
}

export function normalizeTeamAvailability(raw: TeamAvailabilityRaw): TeamAvailability {
  return {
    teamId: raw.team_id,
    rangeStart: raw.range_start,
    rangeEnd: raw.range_end,
    employees: raw.employees.map(normalizeEmployeeAvailability),
  }
}

export function normalizeMeetingRecommendation(
  raw: MeetingRecommendationRaw
): MeetingRecommendation {
  return {
    startDt: raw.start_dt,
    endDt: raw.end_dt,
    availableEmployeeIds: raw.available_employee_ids,
    unavailableEmployeeIds: raw.unavailable_employee_ids,
    score: raw.score,
  }
}
