import { Employee, EmployeeRaw, RiskLevel } from '@/entities/employee/model/types'

export type TeamRole = 'lead' | 'pm' | 'analyst' | 'member'

export const TEAM_ROLES: TeamRole[] = ['lead', 'pm', 'analyst', 'member']

export const TEAM_ROLE_LABEL_RU: Record<TeamRole, string> = {
  lead: 'Лид',
  pm: 'PM',
  analyst: 'Аналитик',
  member: 'Участник',
}

/** Тон для Badge по роли. */
export const TEAM_ROLE_BADGE_TONE: Record<TeamRole, 'accent' | 'primary' | 'info' | 'neutral'> = {
  lead: 'accent',
  pm: 'primary',
  analyst: 'info',
  member: 'neutral',
}

export function normalizeTeamRole(raw: string | null | undefined): TeamRole {
  const normalized = (raw ?? '').toLowerCase().trim()
  return (TEAM_ROLES as string[]).includes(normalized) ? (normalized as TeamRole) : 'member'
}

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
  avatar_url?: string | null
  created_at: string
  updated_at: string
  members?: TeamMemberRaw[]
  members_count?: number
}

export interface TeamMember {
  employeeId: string
  role: TeamRole
  employee?: Employee
}

export interface Team {
  id: string
  name: string
  description: string
  avatarUrl: string | null
  initials: string
  members: TeamMember[]
  /** Если бэк прислал агрегат — используется в листинге без обхода employees. */
  membersCount: number | null
}

export interface TeamMetricsRaw {
  team_id: string
  members_count: number
  attention_count: number
  outdated_count: number
  avg_actuality: number | null
  avg_load: number | null
  max_risk_level: RiskLevel | null
}

export interface TeamMetrics {
  teamId: string
  membersCount: number
  attentionCount: number
  outdatedCount: number
  avgActuality: number | null
  avgLoad: number | null
  maxRiskLevel: RiskLevel | null
}

export interface TeamAvailabilityRankingItemRaw {
  team_id: string
  name: string
  members_count: number
  overlap_ratio: number
  full_team_minutes: number
  majority_minutes: number
  total_window_minutes: number
}

export interface TeamAvailabilityRankingItem {
  teamId: string
  name: string
  membersCount: number
  overlapRatio: number
  fullTeamMinutes: number
  majorityMinutes: number
  totalWindowMinutes: number
}

export interface AvailabilityWindowRaw {
  start_dt: string
  end_dt: string
}

export interface EmployeeAvailabilityRaw {
  employee_id: string
  timezone: string
  available_windows: AvailabilityWindowRaw[]
  busy_windows?: AvailabilityWindowRaw[]
  conflict_windows?: AvailabilityWindowRaw[]
  out_of_schedule_windows?: AvailabilityWindowRaw[]
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
  busyWindows: AvailabilityWindow[]
  conflictWindows: AvailabilityWindow[]
  outOfScheduleWindows: AvailabilityWindow[]
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

export interface CreateTeamMemberInput {
  employeeId: string
  role: TeamRole
}

export interface CreateTeamPayload {
  name: string
  description: string
  avatarUrl: string | null
  members: CreateTeamMemberInput[]
}

export interface CreateTeamMemberInputRaw {
  employee_id: string
  role_in_team: TeamRole
}

export interface CreateTeamPayloadRaw {
  name: string
  description: string
  avatar_url: string | null
  members: CreateTeamMemberInputRaw[]
}
