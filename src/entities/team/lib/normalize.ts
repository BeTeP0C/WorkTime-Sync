import { normalizeEmployee } from '@/entities/employee/lib/normalize'

import {
  AvailabilityWindow,
  AvailabilityWindowRaw,
  EmployeeAvailability,
  EmployeeAvailabilityRaw,
  MeetingRecommendation,
  MeetingRecommendationRaw,
  Team,
  TeamAvailability,
  TeamAvailabilityRaw,
  TeamRaw,
} from '../model/types'

export function normalizeTeam(raw: TeamRaw): Team {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description ?? '',
    members: (raw.members ?? []).map((m) => ({
      employeeId: m.employee_id,
      roleInTeam: m.role_in_team,
      employee: m.employee ? normalizeEmployee(m.employee) : undefined,
    })),
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
