export type ChangeHistoryAction = 'create' | 'update' | 'deactivate' | 'delete'

export type ChangeHistoryEntityType = 'work_schedule' | 'schedule_exception' | 'employee'

export interface ChangeHistoryEntryRaw {
  id: string
  entity_type: string
  entity_id: string
  employee_id: string
  action: string
  changed_by: string
  changed_at: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  reason: string | null
}

export interface ChangeHistoryEntry {
  id: string
  entityType: ChangeHistoryEntityType
  entityId: string
  employeeId: string
  action: ChangeHistoryAction
  changedBy: string
  changedAt: string
  before: Record<string, unknown> | null
  after: Record<string, unknown> | null
  reason: string | null
}

export const ACTION_LABEL_RU: Record<ChangeHistoryAction, string> = {
  create: 'Создание',
  update: 'Обновление',
  deactivate: 'Деактивация',
  delete: 'Удаление',
}

export const ENTITY_LABEL_RU: Record<ChangeHistoryEntityType, string> = {
  work_schedule: 'График',
  schedule_exception: 'Исключение',
  employee: 'Профиль',
}
