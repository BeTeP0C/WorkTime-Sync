export type ExceptionType = 'vacation' | 'sick_leave' | 'business_trip'

export type ExceptionStatus = 'planned' | 'active' | 'completed'

export interface ScheduleExceptionRaw {
  id: string
  employee_id: string
  type: string
  start_dt: string
  end_dt: string
  reason: string | null
  status?: ExceptionStatus
}

export interface ScheduleException {
  id: string
  employeeId: string
  type: ExceptionType
  startDt: string
  endDt: string
  reason: string
  status: ExceptionStatus
}

export const EXCEPTION_LABEL_RU: Record<ExceptionType, string> = {
  vacation: 'Ежегодный отпуск',
  sick_leave: 'Больничный',
  business_trip: 'Командировка',
}

export const EXCEPTION_STATUS_RU: Record<ExceptionStatus, string> = {
  planned: 'Плановый',
  active: 'Активный',
  completed: 'Завершён',
}
