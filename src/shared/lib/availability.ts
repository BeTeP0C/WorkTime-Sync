import { addDays, format, parseISO, startOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'

import { TeamAvailability } from '@/entities/team/model/types'

export interface HeatmapMatrix {
  /** День 0..N-1 (понедельник=0) */
  days: { date: Date; label: string; weekdayLabel: string }[]
  /** Часы (например, 9..18) */
  hours: number[]
  /** matrix[hourIdx][dayIdx] = кол-во доступных */
  counts: number[][]
  /** matrix[hourIdx][dayIdx] = id сотрудников, доступных в этот час */
  available: string[][][]
  totalMembers: number
}

export interface HeatmapConfig {
  startDate: Date
  daysCount: number
  startHour: number
  endHour: number
}

/**
 * Преобразует TeamAvailability (окна по сотруднику) → матрицу [часы × дни] с числом доступных
 */
export function buildHeatmapMatrix(
  availability: TeamAvailability,
  config: HeatmapConfig
): HeatmapMatrix {
  const { startDate, daysCount, startHour, endHour } = config

  const SHORT_WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб']
  const days = Array.from({ length: daysCount }, (_, i) => {
    const date = addDays(startDate, i)
    return {
      date,
      label: format(date, 'd', { locale: ru }),
      weekdayLabel: SHORT_WEEKDAYS[date.getDay()],
    }
  })

  const hours: number[] = []
  for (let h = startHour; h <= endHour; h++) hours.push(h)

  const counts: number[][] = hours.map(() => Array<number>(daysCount).fill(0))
  const available: string[][][] = hours.map(() => Array.from({ length: daysCount }, () => []))

  const totalMembers = availability.employees.length

  for (const emp of availability.employees) {
    for (const w of emp.availableWindows) {
      const start = parseISO(w.startDt)
      const end = parseISO(w.endDt)

      // Найти день в диапазоне
      const dayStart = startOfDay(start)
      const dayIdx = days.findIndex((d) => startOfDay(d.date).getTime() === dayStart.getTime())
      if (dayIdx === -1) continue

      const startHrLocal = start.getHours()
      const endHrLocal = end.getHours() + (end.getMinutes() > 0 ? 1 : 0)

      for (let h = startHour; h <= endHour; h++) {
        if (h >= startHrLocal && h < endHrLocal) {
          const hIdx = h - startHour
          if (!available[hIdx][dayIdx].includes(emp.employeeId)) {
            available[hIdx][dayIdx].push(emp.employeeId)
            counts[hIdx][dayIdx] += 1
          }
        }
      }
    }
  }

  return { days, hours, counts, available, totalMembers }
}

/**
 * Возвращает новый `TeamAvailability` без сотрудников, чьи id есть в excluded.
 * Сам исходный объект не мутируется. Если `excluded` пустой — возвращает исходный объект.
 */
export function filterAvailability(
  availability: TeamAvailability,
  excluded: ReadonlySet<string>
): TeamAvailability {
  if (!excluded || excluded.size === 0) return availability
  return {
    ...availability,
    employees: availability.employees.filter((e) => !excluded.has(e.employeeId)),
  }
}

export function findFullAvailabilityWindows(
  matrix: HeatmapMatrix
): { dayIdx: number; startHour: number; endHour: number }[] {
  const windows: { dayIdx: number; startHour: number; endHour: number }[] = []
  for (let d = 0; d < matrix.days.length; d++) {
    let start: number | null = null
    for (let h = 0; h < matrix.hours.length; h++) {
      const full = matrix.counts[h][d] === matrix.totalMembers && matrix.totalMembers > 0
      if (full && start === null) {
        start = matrix.hours[h]
      }
      if ((!full || h === matrix.hours.length - 1) && start !== null) {
        const endHour = matrix.hours[h] + (full ? 1 : 0)
        windows.push({ dayIdx: d, startHour: start, endHour })
        start = null
      }
    }
  }
  return windows
}

/**
 * Находит «окна большинства» — слоты с >= majorityRatio участников.
 * Возвращает диапазоны и среднее количество доступных.
 */
export function findMajorityWindows(
  matrix: HeatmapMatrix,
  majorityRatio = 0.75
): { dayIdx: number; startHour: number; endHour: number; avgAvailable: number }[] {
  const result: { dayIdx: number; startHour: number; endHour: number; avgAvailable: number }[] = []
  const threshold = Math.ceil(matrix.totalMembers * majorityRatio)
  for (let d = 0; d < matrix.days.length; d++) {
    let start: number | null = null
    let sum = 0
    let countSlots = 0
    for (let h = 0; h < matrix.hours.length; h++) {
      const ok = matrix.counts[h][d] >= threshold && matrix.totalMembers > 0
      if (ok && start === null) {
        start = matrix.hours[h]
        sum = 0
        countSlots = 0
      }
      if (ok) {
        sum += matrix.counts[h][d]
        countSlots += 1
      }
      if ((!ok || h === matrix.hours.length - 1) && start !== null) {
        const endHour = matrix.hours[h] + (ok ? 1 : 0)
        result.push({
          dayIdx: d,
          startHour: start,
          endHour,
          avgAvailable: countSlots > 0 ? sum / countSlots : 0,
        })
        start = null
      }
    }
  }
  return result
}
