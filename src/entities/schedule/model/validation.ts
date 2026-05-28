import { CreateWorkSchedulePayload } from '../api'

/**
 * Возвращает текст первой найденной ошибки или null, если форма валидна.
 * Используется и в drawer'е (HR), и на странице /my/schedule (сотрудник),
 * чтобы правила оставались едиными.
 */
export function validateSchedulePayload(payload: CreateWorkSchedulePayload): string | null {
  if (payload.workDays.length === 0) {
    return 'Выберите хотя бы один рабочий день'
  }
  if (payload.startTime >= payload.endTime) {
    return 'Время начала должно быть раньше времени окончания'
  }
  if (!payload.timezone) {
    return 'Выберите часовой пояс'
  }
  if (!payload.workFormat) {
    return 'Выберите формат работы'
  }
  return null
}
