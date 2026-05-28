import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

import { ActivityEvent, ActivityEventRaw, ActivityEventType } from '../model/types'

export function normalizeActivityEvent(raw: ActivityEventRaw): ActivityEvent {
  return {
    id: raw.id,
    employeeId: raw.employee_id,
    externalId: raw.external_id,
    source: raw.source,
    eventType: raw.event_type,
    title: raw.title,
    startDt: raw.start_dt,
    endDt: raw.end_dt,
    timezone: raw.timezone,
    recurrenceRule: raw.recurrence_rule,
    isRecurring: raw.is_recurring,
    isOutsideSchedule: raw.is_outside_schedule,
  }
}

export async function getEmployeeEvents(employeeId: string): Promise<ActivityEvent[]> {
  const data = await apiClient<ActivityEventRaw[]>('GET', API_URLS.employeeEvents(employeeId))
  return data.map(normalizeActivityEvent)
}

export interface CreateManualEventPayload {
  employeeId: string
  title: string
  eventType: ActivityEventType
  startDt: string // ISO с TZ
  endDt: string
  timezone: string
  recurrenceRule: string | null
  isRecurring: boolean
}

export async function createManualEvent(payload: CreateManualEventPayload): Promise<ActivityEvent> {
  const body = {
    employee_id: payload.employeeId,
    source: 'manual',
    event_type: payload.eventType,
    title: payload.title,
    start_dt: payload.startDt,
    end_dt: payload.endDt,
    timezone: payload.timezone,
    recurrence_rule: payload.recurrenceRule,
    is_recurring: payload.isRecurring,
    is_outside_schedule: false,
  }
  const data = await apiClient<ActivityEventRaw>('POST', API_URLS.eventsManual(), { body })
  return normalizeActivityEvent(data)
}
