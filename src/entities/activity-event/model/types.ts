export interface ActivityEventImportResultRaw {
  imported_count: number
  skipped_duplicate_count: number
  errors: string[]
}

export interface ActivityEventImportResult {
  importedCount: number
  skippedDuplicateCount: number
  errors: string[]
}

export interface ActivityEventRaw {
  id: string
  employee_id: string
  external_id: string | null
  source: string
  event_type: string
  title: string
  start_dt: string
  end_dt: string
  timezone: string
  recurrence_rule: string | null
  is_recurring: boolean
  is_outside_schedule: boolean
}

export interface ActivityEvent {
  id: string
  employeeId: string
  externalId: string | null
  source: string
  eventType: string
  title: string
  startDt: string
  endDt: string
  timezone: string
  recurrenceRule: string | null
  isRecurring: boolean
  isOutsideSchedule: boolean
}

export type ActivityEventType = 'meeting' | 'call' | 'focus'

export const ACTIVITY_EVENT_TYPES: ActivityEventType[] = ['meeting', 'call', 'focus']

export const EVENT_TYPE_LABEL_RU: Record<ActivityEventType, string> = {
  meeting: 'Встреча',
  call: 'Звонок',
  focus: 'Фокус-блок',
}
