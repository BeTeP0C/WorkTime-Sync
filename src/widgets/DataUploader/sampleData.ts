import type { ImportSource } from '@/app-store/stores/DashboardStore'
import { getEmployees } from '@/entities/employee/api'

interface SampleEvent {
  employee_id: string
  external_id: string
  source: string
  event_type: string
  title: string
  start_dt: string
  end_dt: string
  timezone: string
  is_recurring: boolean
  recurrence_rule?: string
}

function isoOffsetDays(days: number, hour: number, minute = 0): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  date.setHours(hour, minute, 0, 0)
  return date.toISOString()
}

function uid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `gen-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

/**
 * Маппинг UI-вкладки → значение поля `source` в payload.
 * Совпадает с серверным IMPORT_SOURCE_API_CODE — query-param и payload.source
 * должны согласоваться (бэк перебивает query-param полем из payload).
 */
const SOURCE_CODE: Record<ImportSource, string> = {
  Календарь: 'calendar',
  'HR-система': 'hr',
  'Таск-трекер': 'tracker',
  Табель: 'timesheet',
}

interface EventTemplate {
  event_type: string
  title: string
  start_day: number
  start_hour: number
  start_minute?: number
  end_day?: number
  end_hour: number
  end_minute?: number
  member_index: 0 | 1 | 2
  is_recurring?: boolean
  recurrence_rule?: string
}

// Календарь — встречи / созвоны / фокус-блоки, в т.ч. вне рабочего времени и регулярные.
const CALENDAR_TEMPLATES: EventTemplate[] = [
  {
    event_type: 'meeting',
    title: 'Daily standup',
    start_day: 1,
    start_hour: 10,
    end_hour: 10,
    end_minute: 30,
    member_index: 0,
    is_recurring: true,
    recurrence_rule: 'FREQ=DAILY;COUNT=5',
  },
  {
    event_type: 'meeting',
    title: 'Sprint planning',
    start_day: 2,
    start_hour: 14,
    end_hour: 15,
    end_minute: 30,
    member_index: 0,
  },
  {
    event_type: 'meeting',
    title: '1:1 с тимлидом',
    start_day: 3,
    start_hour: 11,
    end_hour: 11,
    end_minute: 45,
    member_index: 1,
  },
  {
    event_type: 'focus',
    title: 'Code review',
    start_day: 4,
    start_hour: 9,
    end_hour: 11,
    member_index: 0,
  },
  {
    event_type: 'call',
    title: 'Late client call',
    start_day: 5,
    start_hour: 21,
    end_hour: 22,
    member_index: 2,
  },
  {
    event_type: 'meeting',
    title: 'Weekly retro',
    start_day: 7,
    start_hour: 16,
    end_hour: 17,
    member_index: 0,
    is_recurring: true,
    recurrence_rule: 'FREQ=WEEKLY;COUNT=4',
  },
]

// HR — отсутствия (отпуска, больничные, командировки) длинными интервалами.
const HR_TEMPLATES: EventTemplate[] = [
  {
    event_type: 'vacation',
    title: 'Ежегодный отпуск',
    start_day: 7,
    start_hour: 0,
    end_day: 14,
    end_hour: 23,
    end_minute: 59,
    member_index: 0,
  },
  {
    event_type: 'sick_leave',
    title: 'Больничный',
    start_day: 1,
    start_hour: 0,
    end_day: 3,
    end_hour: 23,
    end_minute: 59,
    member_index: 1,
  },
  {
    event_type: 'business_trip',
    title: 'Командировка в Москву',
    start_day: 5,
    start_hour: 0,
    end_day: 7,
    end_hour: 23,
    end_minute: 59,
    member_index: 2,
  },
  {
    event_type: 'personal_hours',
    title: 'Личные часы (приём врача)',
    start_day: 2,
    start_hour: 12,
    end_hour: 14,
    member_index: 0,
  },
]

// Таск-трекер — рабочие задачи: фокус-блоки и кодинг.
const TRACKER_TEMPLATES: EventTemplate[] = [
  {
    event_type: 'task',
    title: 'TASK-142: Backend refactor',
    start_day: 1,
    start_hour: 9,
    end_hour: 12,
    member_index: 0,
  },
  {
    event_type: 'task',
    title: 'TASK-178: API rate-limit',
    start_day: 1,
    start_hour: 14,
    end_hour: 17,
    member_index: 0,
  },
  {
    event_type: 'task',
    title: 'BUG-204: Login flow',
    start_day: 2,
    start_hour: 10,
    end_hour: 13,
    member_index: 1,
  },
  {
    event_type: 'focus',
    title: 'Deep work: миграция БД',
    start_day: 3,
    start_hour: 9,
    end_hour: 12,
    member_index: 0,
  },
  {
    event_type: 'task',
    title: 'TASK-191: Code review PR #88',
    start_day: 4,
    start_hour: 15,
    end_hour: 16,
    end_minute: 30,
    member_index: 2,
  },
  {
    event_type: 'task',
    title: 'TASK-203: Документация',
    start_day: 5,
    start_hour: 11,
    end_hour: 13,
    member_index: 1,
  },
]

// Табель — учётные часы прихода-ухода (полный рабочий день).
const TIMESHEET_TEMPLATES: EventTemplate[] = [
  {
    event_type: 'work_time',
    title: 'Рабочая смена',
    start_day: 1,
    start_hour: 9,
    end_hour: 18,
    member_index: 0,
  },
  {
    event_type: 'work_time',
    title: 'Рабочая смена',
    start_day: 1,
    start_hour: 9,
    end_hour: 18,
    member_index: 1,
  },
  {
    event_type: 'work_time',
    title: 'Рабочая смена',
    start_day: 1,
    start_hour: 9,
    end_hour: 18,
    member_index: 2,
  },
  {
    event_type: 'overtime',
    title: 'Переработка',
    start_day: 2,
    start_hour: 18,
    end_hour: 20,
    end_minute: 30,
    member_index: 0,
  },
  {
    event_type: 'work_time',
    title: 'Рабочая смена',
    start_day: 2,
    start_hour: 9,
    end_hour: 18,
    member_index: 1,
  },
  {
    event_type: 'work_time',
    title: 'Рабочая смена',
    start_day: 3,
    start_hour: 10,
    end_hour: 19,
    member_index: 0,
  },
]

const TEMPLATES_BY_SOURCE: Record<ImportSource, EventTemplate[]> = {
  Календарь: CALENDAR_TEMPLATES,
  'HR-система': HR_TEMPLATES,
  'Таск-трекер': TRACKER_TEMPLATES,
  Табель: TIMESHEET_TEMPLATES,
}

export async function buildSampleActivityEvents(source: ImportSource): Promise<SampleEvent[]> {
  const employees = await getEmployees()
  if (employees.length === 0) {
    throw new Error('Нет сотрудников — сначала создайте команду')
  }

  const targets = employees.slice(0, Math.min(3, employees.length))
  const timezone = targets[0].timezone || 'Europe/Moscow'
  const apiSource = SOURCE_CODE[source]
  const templates = TEMPLATES_BY_SOURCE[source]

  return templates.map((tpl) => {
    const memberIdx = Math.min(tpl.member_index, targets.length - 1)
    return {
      employee_id: targets[memberIdx].id,
      external_id: uid(),
      source: apiSource,
      event_type: tpl.event_type,
      title: tpl.title,
      start_dt: isoOffsetDays(tpl.start_day, tpl.start_hour, tpl.start_minute ?? 0),
      end_dt: isoOffsetDays(tpl.end_day ?? tpl.start_day, tpl.end_hour, tpl.end_minute ?? 0),
      timezone,
      is_recurring: tpl.is_recurring ?? false,
      ...(tpl.recurrence_rule ? { recurrence_rule: tpl.recurrence_rule } : {}),
    }
  })
}
