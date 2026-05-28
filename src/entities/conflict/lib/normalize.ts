import {
  AlternativeWindow,
  AlternativeWindowRaw,
  ConflictEvent,
  ConflictEventRaw,
  ConflictList,
  ConflictListRaw,
} from '../model/types'

export function normalizeConflict(raw: ConflictEventRaw): ConflictEvent {
  return {
    id: raw.id,
    employeeId: raw.employee_id,
    employeeFullName: raw.employee_full_name,
    teamId: raw.team_id,
    teamName: raw.team_name,
    title: raw.title,
    startDt: raw.start_dt,
    endDt: raw.end_dt,
    timezone: raw.timezone,
    eventType: raw.event_type,
    source: raw.source,
    scheduleStartTime: raw.schedule_start_time,
    scheduleEndTime: raw.schedule_end_time,
  }
}

export function normalizeConflictList(raw: ConflictListRaw): ConflictList {
  return {
    items: raw.items.map(normalizeConflict),
    total: raw.total,
  }
}

export function normalizeAlternativeWindow(raw: AlternativeWindowRaw): AlternativeWindow {
  return {
    startDt: raw.start_dt,
    endDt: raw.end_dt,
    localStart: raw.local_start,
    localEnd: raw.local_end,
    reason: raw.reason,
  }
}
