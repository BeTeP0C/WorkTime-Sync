import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

export interface ScheduleDiagnosticsRaw {
  window_days: number
  total_events: number
  outside_events: number
  outside_after_hour: number | null
  has_timezone_drift: boolean
  days_since_update: number
  should_show_alert: boolean
}

export interface ScheduleDiagnostics {
  windowDays: number
  totalEvents: number
  outsideEvents: number
  outsideAfterHour: number | null
  hasTimezoneDrift: boolean
  daysSinceUpdate: number
  shouldShowAlert: boolean
}

function normalize(raw: ScheduleDiagnosticsRaw): ScheduleDiagnostics {
  return {
    windowDays: raw.window_days,
    totalEvents: raw.total_events,
    outsideEvents: raw.outside_events,
    outsideAfterHour: raw.outside_after_hour,
    hasTimezoneDrift: raw.has_timezone_drift,
    daysSinceUpdate: raw.days_since_update,
    shouldShowAlert: raw.should_show_alert,
  }
}

export async function getScheduleDiagnostics(employeeId: string): Promise<ScheduleDiagnostics> {
  const raw = await apiClient<ScheduleDiagnosticsRaw>(
    'GET',
    API_URLS.employeeScheduleDiagnostics(employeeId)
  )
  return normalize(raw)
}
