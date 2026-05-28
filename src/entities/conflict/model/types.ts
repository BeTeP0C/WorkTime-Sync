export interface ConflictEventRaw {
  id: string
  employee_id: string
  employee_full_name: string
  team_id: string | null
  team_name: string | null
  title: string
  start_dt: string
  end_dt: string
  timezone: string
  event_type: string
  source: string
  schedule_start_time: string | null
  schedule_end_time: string | null
}

export interface ConflictListRaw {
  items: ConflictEventRaw[]
  total: number
}

export interface ConflictEvent {
  id: string
  employeeId: string
  employeeFullName: string
  teamId: string | null
  teamName: string | null
  title: string
  startDt: string
  endDt: string
  timezone: string
  eventType: string
  source: string
  scheduleStartTime: string | null
  scheduleEndTime: string | null
}

export interface ConflictList {
  items: ConflictEvent[]
  total: number
}

export interface AlternativeWindowRaw {
  start_dt: string
  end_dt: string
  local_start: string
  local_end: string
  reason: string
}

export interface AlternativeWindow {
  startDt: string
  endDt: string
  localStart: string
  localEnd: string
  reason: string
}

export interface ProposeReschedulePayload {
  alternative_start_dt: string
  alternative_end_dt: string
  note?: string | null
}

export interface ConflictListFilters {
  teamId?: string | null
  employeeId?: string | null
  rangeStart?: string | null
  rangeEnd?: string | null
  search?: string | null
  limit?: number
  offset?: number
}
