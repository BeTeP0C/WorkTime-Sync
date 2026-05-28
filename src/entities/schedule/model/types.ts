export type WeekDayIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 // 0=Monday по API бэка

export type WorkFormat = 'office' | 'remote' | 'hybrid'

export interface WorkScheduleRaw {
  id: string
  employee_id: string
  work_days: number[]
  start_time: string // "09:00:00"
  end_time: string // "18:00:00"
  timezone: string
  work_format: WorkFormat
  last_updated_at: string
  confirmed_at: string | null
  is_active: boolean
  created_at: string
}

export interface WorkSchedule {
  id: string
  employeeId: string
  workDays: WeekDayIndex[]
  startTime: string // "09:00"
  endTime: string // "18:00"
  timezone: string
  workFormat: WorkFormat
  lastUpdatedAt: string
  confirmedAt: string | null
  isActive: boolean
}

export const WEEKDAY_LABEL_RU: Record<WeekDayIndex, string> = {
  0: 'Пн',
  1: 'Вт',
  2: 'Ср',
  3: 'Чт',
  4: 'Пт',
  5: 'Сб',
  6: 'Вс',
}
