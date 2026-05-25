import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

import { WeekDayIndex, WorkSchedule, WorkScheduleRaw } from '../model/types'

function normalize(raw: WorkScheduleRaw): WorkSchedule {
  const trim = (t: string): string => t.slice(0, 5)
  return {
    id: raw.id,
    employeeId: raw.employee_id,
    workDays: raw.work_days as WeekDayIndex[],
    startTime: trim(raw.start_time),
    endTime: trim(raw.end_time),
    timezone: raw.timezone,
    lastUpdatedAt: raw.last_updated_at,
    isActive: raw.is_active,
  }
}

export async function getEmployeeActiveSchedule(employeeId: string): Promise<WorkSchedule> {
  const data = await apiClient<WorkScheduleRaw>('GET', API_URLS.employeeScheduleActive(employeeId))
  return normalize(data)
}
