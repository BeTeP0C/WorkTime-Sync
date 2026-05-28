import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

import { WeekDayIndex, WorkFormat, WorkSchedule, WorkScheduleRaw } from '../model/types'

export function normalizeSchedule(raw: WorkScheduleRaw): WorkSchedule {
  const trim = (t: string): string => t.slice(0, 5)
  return {
    id: raw.id,
    employeeId: raw.employee_id,
    workDays: raw.work_days as WeekDayIndex[],
    startTime: trim(raw.start_time),
    endTime: trim(raw.end_time),
    timezone: raw.timezone,
    workFormat: raw.work_format,
    lastUpdatedAt: raw.last_updated_at,
    confirmedAt: raw.confirmed_at ?? null,
    isActive: raw.is_active,
  }
}

export async function getEmployeeActiveSchedule(employeeId: string): Promise<WorkSchedule> {
  const data = await apiClient<WorkScheduleRaw>('GET', API_URLS.employeeScheduleActive(employeeId))
  return normalizeSchedule(data)
}

export interface CreateWorkSchedulePayload {
  workDays: WeekDayIndex[]
  startTime: string // "HH:MM"
  endTime: string // "HH:MM"
  timezone: string
  workFormat: WorkFormat
}

export async function createWorkSchedule(
  employeeId: string,
  payload: CreateWorkSchedulePayload
): Promise<WorkSchedule> {
  const body = {
    employee_id: employeeId,
    work_days: payload.workDays,
    start_time: `${payload.startTime}:00`,
    end_time: `${payload.endTime}:00`,
    timezone: payload.timezone,
    work_format: payload.workFormat,
    last_updated_at: new Date().toISOString(),
    is_active: true,
  }
  const data = await apiClient<WorkScheduleRaw>('POST', API_URLS.employeeSchedules(employeeId), {
    body,
  })
  return normalizeSchedule(data)
}
