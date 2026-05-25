import { Employee, EmployeeRaw } from '@/entities/employee/model/types'

export interface TeamMemberRaw {
  team_id: string
  employee_id: string
  role_in_team: string
  created_at: string
  employee?: EmployeeRaw
}

export interface TeamRaw {
  id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  members?: TeamMemberRaw[]
}

export interface TeamMember {
  employeeId: string
  roleInTeam: string
  employee?: Employee
}

export interface Team {
  id: string
  name: string
  description: string
  members: TeamMember[]
}

export interface AvailabilityWindowRaw {
  start_dt: string
  end_dt: string
}

export interface EmployeeAvailabilityRaw {
  employee_id: string
  timezone: string
  available_windows: AvailabilityWindowRaw[]
}

export interface TeamAvailabilityRaw {
  team_id: string
  range_start: string
  range_end: string
  employees: EmployeeAvailabilityRaw[]
}

export interface AvailabilityWindow {
  startDt: string
  endDt: string
}

export interface EmployeeAvailability {
  employeeId: string
  timezone: string
  availableWindows: AvailabilityWindow[]
}

export interface TeamAvailability {
  teamId: string
  rangeStart: string
  rangeEnd: string
  employees: EmployeeAvailability[]
}

export interface MeetingRecommendationRaw {
  start_dt: string
  end_dt: string
  available_employee_ids: string[]
  unavailable_employee_ids: string[]
  score: number
}

export interface MeetingRecommendation {
  startDt: string
  endDt: string
  availableEmployeeIds: string[]
  unavailableEmployeeIds: string[]
  score: number
}
