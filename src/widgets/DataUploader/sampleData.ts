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

export async function buildSampleActivityEvents(): Promise<SampleEvent[]> {
  const employees = await getEmployees()
  if (employees.length === 0) {
    throw new Error('Нет сотрудников — сначала создайте команду')
  }

  const targets = employees.slice(0, Math.min(3, employees.length))
  const timezone = targets[0].timezone || 'Europe/Moscow'

  const events: SampleEvent[] = [
    {
      employee_id: targets[0].id,
      external_id: uid(),
      source: 'mock',
      event_type: 'meeting',
      title: 'Daily standup',
      start_dt: isoOffsetDays(1, 10),
      end_dt: isoOffsetDays(1, 10, 30),
      timezone,
      is_recurring: false,
    },
    {
      employee_id: targets[0].id,
      external_id: uid(),
      source: 'mock',
      event_type: 'meeting',
      title: 'Sprint planning',
      start_dt: isoOffsetDays(2, 14),
      end_dt: isoOffsetDays(2, 15, 30),
      timezone,
      is_recurring: false,
    },
    {
      employee_id: targets[Math.min(1, targets.length - 1)].id,
      external_id: uid(),
      source: 'mock',
      event_type: 'meeting',
      title: '1:1 с тимлидом',
      start_dt: isoOffsetDays(3, 11),
      end_dt: isoOffsetDays(3, 11, 45),
      timezone,
      is_recurring: false,
    },
    {
      employee_id: targets[0].id,
      external_id: uid(),
      source: 'mock',
      event_type: 'focus',
      title: 'Code review',
      start_dt: isoOffsetDays(4, 9),
      end_dt: isoOffsetDays(4, 11),
      timezone,
      is_recurring: false,
    },
    {
      employee_id: targets[Math.min(2, targets.length - 1)].id,
      external_id: uid(),
      source: 'mock',
      event_type: 'call',
      title: 'Late client call',
      start_dt: isoOffsetDays(5, 21),
      end_dt: isoOffsetDays(5, 22),
      timezone,
      is_recurring: false,
    },
    {
      employee_id: targets[0].id,
      external_id: uid(),
      source: 'mock',
      event_type: 'meeting',
      title: 'Weekly retro',
      start_dt: isoOffsetDays(7, 16),
      end_dt: isoOffsetDays(7, 17),
      timezone,
      is_recurring: true,
      recurrence_rule: 'FREQ=WEEKLY;COUNT=4',
    },
  ]

  return events
}
