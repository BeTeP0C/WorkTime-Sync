import { addDays, format, parseISO, startOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'

import { Employee } from '@/entities/employee/model/types'
import { TeamAvailability } from '@/entities/team/model/types'

export type ProblemSeverity = 'warning' | 'error'

export interface ProblemDay {
  dayIdx: number
  date: Date
  dayLabel: string
  severity: ProblemSeverity
  reasons: string[]
  unavailableNames: string[]
}

interface ComputeOptions {
  daysCount?: number
  workHoursPerDay?: number
  /** Доля сотрудников, при которой день считается проблемным (доля недоступных). */
  warningRatio?: number
  errorRatio?: number
  /** Часовой пояс «большинства» — для подсветки outsider'ов. */
  majorityTimezone?: string | null
}

const FORMAT_OPTIONS = { locale: ru }

/**
 * Для каждого дня смотрит:
 *  - сколько участников полностью недоступны (нет available windows / busy перекрывает все часы);
 *  - сколько в outlier-таймзоне (если задана majorityTimezone и участник не в ней — отметка).
 *
 * День помечается:
 *  - error, если ≥ errorRatio участников недоступны;
 *  - warning, если ≥ warningRatio.
 */
export function computeProblemDays(
  availability: TeamAvailability,
  members: Employee[],
  weekStart: Date,
  options: ComputeOptions = {}
): ProblemDay[] {
  const {
    daysCount = 7,
    workHoursPerDay = 6,
    warningRatio = 0.3,
    errorRatio = 0.6,
    majorityTimezone = null,
  } = options

  if (availability.employees.length === 0) return []

  const employeesById = new Map(members.map((m) => [m.id, m]))

  const result: ProblemDay[] = []
  for (let dayIdx = 0; dayIdx < daysCount; dayIdx++) {
    const date = addDays(weekStart, dayIdx)
    const dayStart = startOfDay(date).getTime()

    const unavailableIds: string[] = []
    const onLeaveIds: string[] = []
    const outsiderIds: string[] = []
    // «Вовлечён в день» = у сотрудника есть availableWindows или явное out-of-schedule
    // на этот день. Это отделяет реальные рабочие дни от естественных выходных
    // (Mon-Fri сотрудник на субботу: 0 available + 0 OOS → не вовлечён, день не наш).
    let engaged = 0

    for (const empAvail of availability.employees) {
      const availableHours = empAvail.availableWindows.reduce((acc, w) => {
        const start = parseISO(w.startDt)
        if (startOfDay(start).getTime() !== dayStart) return acc
        const end = parseISO(w.endDt)
        return acc + (end.getTime() - start.getTime()) / 3_600_000
      }, 0)

      const hasOutOfScheduleAllDay = empAvail.outOfScheduleWindows.some((w) => {
        const s = parseISO(w.startDt)
        return startOfDay(s).getTime() === dayStart
      })

      const hasAnyAvailable = availableHours > 0
      const isEngaged = hasAnyAvailable || hasOutOfScheduleAllDay
      if (!isEngaged) continue
      engaged++

      if (availableHours < workHoursPerDay * 0.25) {
        unavailableIds.push(empAvail.employeeId)
        // Если есть out_of_schedule на весь день — это вне графика (отпуск/командировка).
        if (hasOutOfScheduleAllDay) onLeaveIds.push(empAvail.employeeId)
      }

      if (majorityTimezone && empAvail.timezone !== majorityTimezone && availableHours > 0) {
        outsiderIds.push(empAvail.employeeId)
      }
    }

    // Никто из команды не работает в этот день (выходной) — не показываем как проблему.
    if (engaged === 0) continue

    const ratio = unavailableIds.length / engaged
    if (ratio < warningRatio) continue

    const severity: ProblemSeverity = ratio >= errorRatio ? 'error' : 'warning'
    const reasons: string[] = []

    if (onLeaveIds.length > 0) {
      const names = onLeaveIds
        .map((id) => employeesById.get(id)?.fullName)
        .filter(Boolean)
        .slice(0, 2)
        .join(', ')
      reasons.push(
        onLeaveIds.length === 1
          ? `${names} — вне графика`
          : `${onLeaveIds.length} ${pluralizeRu(onLeaveIds.length, ['сотрудник вне графика', 'сотрудника вне графика', 'сотрудников вне графика'])}${names ? ` (${names}…)` : ''}`
      )
    }

    const busyOnly = unavailableIds.filter((id) => !onLeaveIds.includes(id))
    if (busyOnly.length > 0) {
      const names = busyOnly
        .map((id) => employeesById.get(id)?.fullName)
        .filter(Boolean)
        .slice(0, 2)
        .join(', ')
      reasons.push(
        busyOnly.length === 1
          ? `${names} — плотный календарь`
          : `${busyOnly.length} с плотным календарём${names ? ` (${names}…)` : ''}`
      )
    }

    if (outsiderIds.length > 0) {
      reasons.push(`${outsiderIds.length} в другой таймзоне`)
    }

    result.push({
      dayIdx,
      date,
      dayLabel: format(date, 'EEEE, d MMM', FORMAT_OPTIONS),
      severity,
      reasons,
      unavailableNames: unavailableIds
        .map((id) => employeesById.get(id)?.fullName)
        .filter((n): n is string => Boolean(n)),
    })
  }

  return result
}

function pluralizeRu(count: number, forms: [string, string, string]): string {
  const mod10 = count % 10
  const mod100 = count % 100
  if (mod10 === 1 && mod100 !== 11) return forms[0]
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return forms[1]
  return forms[2]
}
