import { TeamRole } from '@/entities/team/model/types'
import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient, apiClientWithMeta } from '@/shared/api/client'

import { normalizeEmployee } from '../lib/normalize'
import {
  Employee,
  EmployeeRaw,
  EmployeeRole,
  EmploymentType,
  RiskLevel,
  WorkFormat,
} from '../model/types'

export type EmployeeCategoryFilter =
  | 'actual'
  | 'outdated'
  | 'outside_schedule'
  | 'overloaded'
  | 'in_absence'
  | 'hr_calendar_conflict'
  | 'timezone_conflict'
  | 'needs_review'
  | 'pending_confirmation'

export interface EmployeeListFilters {
  teamId?: string | null
  riskLevel?: RiskLevel | null
  workFormat?: WorkFormat | null
  search?: string | null
  category?: EmployeeCategoryFilter | null
}

function buildQuery(filters: EmployeeListFilters | undefined): Record<string, string> | undefined {
  if (!filters) return undefined
  const query: Record<string, string> = {}
  if (filters.teamId) query.team_id = filters.teamId
  if (filters.riskLevel) query.risk_level = filters.riskLevel
  if (filters.workFormat) query.work_format = filters.workFormat
  if (filters.search && filters.search.trim().length > 0) query.search = filters.search.trim()
  if (filters.category) query.category = filters.category
  return Object.keys(query).length > 0 ? query : undefined
}

export async function getEmployees(filters?: EmployeeListFilters): Promise<Employee[]> {
  const data = await apiClient<EmployeeRaw[]>('GET', API_URLS.employees(), {
    query: buildQuery(filters),
  })
  return data.map(normalizeEmployee)
}

export interface PaginatedEmployeesResult {
  items: Employee[]
  total: number
}

export async function getEmployeesPaginated(
  filters: EmployeeListFilters | undefined,
  skip: number,
  limit: number
): Promise<PaginatedEmployeesResult> {
  const baseQuery = buildQuery(filters) ?? {}
  const query: Record<string, string> = {
    ...baseQuery,
    skip: String(skip),
    limit: String(limit),
  }
  const { data, headers } = await apiClientWithMeta<EmployeeRaw[]>('GET', API_URLS.employees(), {
    query,
  })
  const totalHeader = headers.get('X-Total-Count')
  const total = totalHeader !== null ? Number(totalHeader) : data.length
  return { items: data.map(normalizeEmployee), total }
}

export async function getEmployee(id: string): Promise<Employee> {
  const data = await apiClient<EmployeeRaw>('GET', API_URLS.employee(id))
  return normalizeEmployee(data)
}

export interface UpdateEmployeePayload {
  fullName?: string
  email?: string | null
  position?: string | null
  hireDate?: string | null
}

export async function updateEmployee(
  id: string,
  payload: UpdateEmployeePayload
): Promise<Employee> {
  const body: Record<string, unknown> = {}
  if (payload.fullName !== undefined) body.full_name = payload.fullName
  if (payload.email !== undefined) body.email = payload.email
  if (payload.position !== undefined) body.position = payload.position
  if (payload.hireDate !== undefined) body.hire_date = payload.hireDate
  const data = await apiClient<EmployeeRaw>('PATCH', API_URLS.employee(id), { body })
  return normalizeEmployee(data)
}

export interface CreateEmployeePayload {
  fullName: string
  email?: string | null
  position?: string | null
  role: EmployeeRole
  timezone: string
  workFormat: WorkFormat
}

export async function createEmployee(payload: CreateEmployeePayload): Promise<Employee> {
  const body: Record<string, unknown> = {
    full_name: payload.fullName,
    role: payload.role,
    timezone: payload.timezone,
    work_format: payload.workFormat,
  }
  if (payload.email !== undefined) body.email = payload.email
  if (payload.position !== undefined) body.position = payload.position
  const data = await apiClient<EmployeeRaw>('POST', API_URLS.employees(), { body })
  return normalizeEmployee(data)
}

interface BulkConfirmationRequestRaw {
  created: { id: string; employee_id: string }[]
  skipped_employee_ids: string[]
}

export interface BulkConfirmationRequestResult {
  createdCount: number
  skippedCount: number
}

export async function bulkRequestScheduleConfirmation(
  employeeIds: string[],
  reason?: string
): Promise<BulkConfirmationRequestResult> {
  const body: Record<string, unknown> = { employee_ids: employeeIds }
  if (reason !== undefined) body.reason = reason
  const data = await apiClient<BulkConfirmationRequestRaw>(
    'POST',
    API_URLS.employeesConfirmationRequestsBulk(),
    { body }
  )
  return {
    createdCount: data.created.length,
    skippedCount: data.skipped_employee_ids.length,
  }
}

export interface CreateEmployeeFullScheduleInput {
  workDays: number[] // 0=Пн..6=Вс
  startTime: string // 'HH:MM'
  endTime: string // 'HH:MM'
  timezone: string
}

export interface CreateEmployeeFullTeamInput {
  teamId: string
  roleInTeam: TeamRole
}

export interface CreateEmployeeFullPayload {
  vkUserId: string | null
  role: EmployeeRole
  fullName: string
  email: string | null
  position: string | null
  hireDate: string | null
  employmentType: EmploymentType
  timezone: string
  workFormat: WorkFormat
  schedule: CreateEmployeeFullScheduleInput
  team: CreateEmployeeFullTeamInput | null
}

export async function createEmployeeFull(payload: CreateEmployeeFullPayload): Promise<Employee> {
  const body = {
    vk_user_id: payload.vkUserId,
    role: payload.role,
    full_name: payload.fullName,
    email: payload.email,
    position: payload.position,
    hire_date: payload.hireDate,
    employment_type: payload.employmentType,
    timezone: payload.timezone,
    work_format: payload.workFormat,
    schedule: {
      work_days: payload.schedule.workDays,
      // на бэке `time` — допускаем "HH:MM" или "HH:MM:SS"; добавляем ":00" для надёжности
      start_time: ensureTimeWithSeconds(payload.schedule.startTime),
      end_time: ensureTimeWithSeconds(payload.schedule.endTime),
      timezone: payload.schedule.timezone,
    },
    team: payload.team
      ? { team_id: payload.team.teamId, role_in_team: payload.team.roleInTeam }
      : null,
  }
  const data = await apiClient<EmployeeRaw>('POST', API_URLS.employeesFull(), { body })
  return normalizeEmployee(data)
}

function ensureTimeWithSeconds(value: string): string {
  return value.length === 5 ? `${value}:00` : value
}
