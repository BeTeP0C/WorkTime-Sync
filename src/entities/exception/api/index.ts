import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

import {
  ExceptionStatus,
  ExceptionType,
  ScheduleException,
  ScheduleExceptionRaw,
} from '../model/types'

function deriveStatus(startDt: string, endDt: string, raw?: ExceptionStatus): ExceptionStatus {
  if (raw) return raw
  const now = Date.now()
  const start = new Date(startDt).getTime()
  const end = new Date(endDt).getTime()
  if (now < start) return 'planned'
  if (now > end) return 'completed'
  return 'active'
}

function normalize(raw: ScheduleExceptionRaw): ScheduleException {
  // На бэке тип может быть "sick" или "sick_leave" — приводим к одному виду
  const type = (raw.type === 'sick' ? 'sick_leave' : raw.type) as ExceptionType
  return {
    id: raw.id,
    employeeId: raw.employee_id,
    type,
    startDt: raw.start_dt,
    endDt: raw.end_dt,
    reason: raw.reason ?? '',
    status: deriveStatus(raw.start_dt, raw.end_dt, raw.status),
  }
}

export async function getEmployeeExceptions(employeeId: string): Promise<ScheduleException[]> {
  const data = await apiClient<ScheduleExceptionRaw[]>(
    'GET',
    API_URLS.employeeExceptions(employeeId)
  )
  return data.map(normalize)
}
