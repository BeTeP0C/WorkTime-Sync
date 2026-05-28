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

const KNOWN_TYPES: Record<string, ExceptionType> = {
  vacation: 'vacation',
  sick: 'sick_leave',
  sick_leave: 'sick_leave',
  business_trip: 'business_trip',
  personal_hours: 'personal_hours',
}

export function normalizeException(raw: ScheduleExceptionRaw): ScheduleException {
  const type: ExceptionType = KNOWN_TYPES[raw.type] ?? 'vacation'
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
  return data.map(normalizeException)
}

export interface CreateScheduleExceptionPayload {
  type: ExceptionType
  startDt: string // ISO
  endDt: string // ISO
  reason: string | null
}

export async function createScheduleException(
  employeeId: string,
  payload: CreateScheduleExceptionPayload
): Promise<ScheduleException> {
  const body = {
    employee_id: employeeId,
    type: payload.type,
    start_dt: payload.startDt,
    end_dt: payload.endDt,
    reason: payload.reason,
  }
  const data = await apiClient<ScheduleExceptionRaw>(
    'POST',
    API_URLS.employeeExceptions(employeeId),
    { body }
  )
  return normalizeException(data)
}

export interface UpdateScheduleExceptionPayload {
  type?: ExceptionType
  startDt?: string
  endDt?: string
  reason?: string | null
}

export async function updateScheduleException(
  employeeId: string,
  exceptionId: string,
  payload: UpdateScheduleExceptionPayload
): Promise<ScheduleException> {
  const body: Record<string, unknown> = {}
  if (payload.type !== undefined) body.type = payload.type
  if (payload.startDt !== undefined) body.start_dt = payload.startDt
  if (payload.endDt !== undefined) body.end_dt = payload.endDt
  if (payload.reason !== undefined) body.reason = payload.reason
  const data = await apiClient<ScheduleExceptionRaw>(
    'PATCH',
    API_URLS.employeeException(employeeId, exceptionId),
    { body }
  )
  return normalizeException(data)
}

export async function deleteScheduleException(
  employeeId: string,
  exceptionId: string
): Promise<void> {
  await apiClient<void>('DELETE', API_URLS.employeeException(employeeId, exceptionId))
}
