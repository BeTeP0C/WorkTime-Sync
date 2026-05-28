import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

import {
  ChangeHistoryAction,
  ChangeHistoryEntityType,
  ChangeHistoryEntry,
  ChangeHistoryEntryRaw,
} from '../model/types'

const KNOWN_ENTITY_TYPES: ChangeHistoryEntityType[] = [
  'work_schedule',
  'schedule_exception',
  'employee',
]

const KNOWN_ACTIONS: ChangeHistoryAction[] = ['create', 'update', 'deactivate', 'delete']

function coerceEntityType(value: string): ChangeHistoryEntityType {
  return (KNOWN_ENTITY_TYPES as string[]).includes(value)
    ? (value as ChangeHistoryEntityType)
    : 'employee'
}

function coerceAction(value: string): ChangeHistoryAction {
  return (KNOWN_ACTIONS as string[]).includes(value) ? (value as ChangeHistoryAction) : 'update'
}

export function normalizeChangeEntry(raw: ChangeHistoryEntryRaw): ChangeHistoryEntry {
  return {
    id: raw.id,
    entityType: coerceEntityType(raw.entity_type),
    entityId: raw.entity_id,
    employeeId: raw.employee_id,
    action: coerceAction(raw.action),
    changedBy: raw.changed_by,
    changedAt: raw.changed_at,
    before: raw.before,
    after: raw.after,
    reason: raw.reason,
  }
}

export interface GetEmployeeHistoryOptions {
  entityType?: ChangeHistoryEntityType
  skip?: number
  limit?: number
}

export async function getEmployeeHistory(
  employeeId: string,
  options: GetEmployeeHistoryOptions = {}
): Promise<ChangeHistoryEntry[]> {
  const query: Record<string, string | number> = {}
  if (options.entityType) query.entity_type = options.entityType
  if (options.skip !== undefined) query.skip = options.skip
  if (options.limit !== undefined) query.limit = options.limit
  const data = await apiClient<ChangeHistoryEntryRaw[]>(
    'GET',
    API_URLS.employeeHistory(employeeId),
    { query }
  )
  return data.map(normalizeChangeEntry)
}
