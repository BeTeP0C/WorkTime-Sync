import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

import { normalizeAlternativeWindow, normalizeConflictList } from '../lib/normalize'
import {
  AlternativeWindow,
  AlternativeWindowRaw,
  ConflictList,
  ConflictListFilters,
  ConflictListRaw,
  ProposeReschedulePayload,
} from '../model/types'

export async function getConflicts(filters: ConflictListFilters): Promise<ConflictList> {
  const raw = await apiClient<ConflictListRaw>('GET', API_URLS.conflicts(), {
    query: {
      team_id: filters.teamId ?? undefined,
      employee_id: filters.employeeId ?? undefined,
      range_start: filters.rangeStart ?? undefined,
      range_end: filters.rangeEnd ?? undefined,
      search: filters.search || undefined,
      limit: filters.limit ?? undefined,
      offset: filters.offset ?? undefined,
    },
  })
  return normalizeConflictList(raw)
}

export async function getConflictAlternatives(eventId: string): Promise<AlternativeWindow[]> {
  const raw = await apiClient<AlternativeWindowRaw[]>('GET', API_URLS.conflictAlternatives(eventId))
  return raw.map(normalizeAlternativeWindow)
}

export async function proposeReschedule(
  eventId: string,
  payload: ProposeReschedulePayload
): Promise<void> {
  await apiClient<void>('POST', API_URLS.conflictProposeReschedule(eventId), { body: payload })
}
