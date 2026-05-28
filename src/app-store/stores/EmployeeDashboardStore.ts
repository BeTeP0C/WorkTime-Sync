import { makeAutoObservable, runInAction } from 'mobx'

import { getEmployeeEvents } from '@/entities/activity-event/api'
import { ActivityEvent } from '@/entities/activity-event/model/types'
import { confirmEmployeeSchedule } from '@/entities/confirmation/api'
import { getEmployee } from '@/entities/employee/api'
import { Employee } from '@/entities/employee/model/types'
import { getEmployeeExceptions } from '@/entities/exception/api'
import { ScheduleException } from '@/entities/exception/model/types'
import { getEmployeeRecommendations } from '@/entities/recommendation/api'
import { Recommendation } from '@/entities/recommendation/model/types'
import { getEmployeeActiveSchedule } from '@/entities/schedule/api'
import { WorkSchedule } from '@/entities/schedule/model/types'
import { LoadingStageModel, ValueModel } from '@/shared/model'

const UPCOMING_EVENTS_LIMIT = 3

const SEVERITY_RANK: Record<Recommendation['severity'], number> = {
  critical: 3,
  high: 2,
  medium: 1,
}

export interface WeekDayBucket {
  /** Дата дня недели (YYYY-MM-DD, local) */
  dateIso: string
  /** Индекс по WeekDayIndex (0=Пн … 6=Вс) */
  weekday: number
  isToday: boolean
  isWeekend: boolean
  eventsCount: number
  hasConflict: boolean
}

/**
 * Стор личного дашборда сотрудника. Парный к EmployeeProfileStore, но компактнее:
 * грузит только то, что нужно для главной (без AI-объяснений и confirmation requests).
 */
export class EmployeeDashboardStore {
  readonly employeeId: string

  employee = new ValueModel<Employee | null>(null)
  schedule = new ValueModel<WorkSchedule | null>(null)
  exceptions = new ValueModel<ScheduleException[]>([])
  events = new ValueModel<ActivityEvent[]>([])
  recommendations = new ValueModel<Recommendation[]>([])

  loadingStage = new LoadingStageModel()
  confirmStage = new LoadingStageModel()
  lastConfirmError: string | null = null

  constructor(employeeId: string) {
    this.employeeId = employeeId
    makeAutoObservable(this)
  }

  /** Возвращает число дней с последнего подтверждения графика. */
  get daysSinceConfirm(): number | null {
    const schedule = this.schedule.value
    if (!schedule?.confirmedAt) return null
    const confirmedAt = new Date(schedule.confirmedAt).getTime()
    const diffMs = Date.now() - confirmedAt
    if (Number.isNaN(diffMs) || diffMs < 0) return 0
    return Math.floor(diffMs / (1000 * 60 * 60 * 24))
  }

  /** Топ-рекомендация по severity (critical > high > medium). */
  get topRecommendation(): Recommendation | null {
    const list = this.recommendations.value
    if (list.length === 0) return null
    return [...list].sort(
      (a, b) => (SEVERITY_RANK[b.severity] ?? 0) - (SEVERITY_RANK[a.severity] ?? 0)
    )[0]
  }

  /** Ближайшие N событий, начиная с сейчас. */
  get upcomingEvents(): ActivityEvent[] {
    const now = Date.now()
    return [...this.events.value]
      .filter((e) => new Date(e.endDt).getTime() >= now)
      .sort((a, b) => new Date(a.startDt).getTime() - new Date(b.startDt).getTime())
      .slice(0, UPCOMING_EVENTS_LIMIT)
  }

  /** Бакеты по дням текущей рабочей недели (Пн–Вс, ровно 7 элементов). */
  get weekBuckets(): WeekDayBucket[] {
    const monday = getMondayOfCurrentWeek()
    const todayKey = toLocalDateKey(new Date())
    const events = this.events.value
    const workdays = new Set(this.schedule.value?.workDays ?? [])

    return Array.from({ length: 7 }, (_, weekday) => {
      const date = new Date(monday)
      date.setDate(monday.getDate() + weekday)
      const dateIso = toLocalDateKey(date)
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)
      const startMs = dayStart.getTime()
      const endMs = dayEnd.getTime()

      const dayEvents = events.filter((e) => {
        const t = new Date(e.startDt).getTime()
        return t >= startMs && t <= endMs
      })
      const hasConflict = dayEvents.some((e) => e.isOutsideSchedule)

      return {
        dateIso,
        weekday,
        isToday: dateIso === todayKey,
        isWeekend:
          workdays.size > 0 ? !workdays.has(weekday as 0 | 1 | 2 | 3 | 4 | 5 | 6) : weekday >= 5,
        eventsCount: dayEvents.length,
        hasConflict,
      }
    })
  }

  async fetch(): Promise<void> {
    if (this.loadingStage.isLoading) return
    this.loadingStage.loading()
    try {
      const [employee, schedule, exceptions, events, recommendations] = await Promise.all([
        getEmployee(this.employeeId),
        getEmployeeActiveSchedule(this.employeeId).catch(() => null),
        getEmployeeExceptions(this.employeeId).catch(() => []),
        getEmployeeEvents(this.employeeId).catch(() => []),
        getEmployeeRecommendations(this.employeeId).catch(() => []),
      ])
      runInAction(() => {
        this.employee.change(employee)
        this.schedule.change(schedule)
        this.exceptions.change(exceptions)
        this.events.change(events)
        this.recommendations.change(recommendations)
        this.loadingStage.success()
      })
    } catch (error) {
      console.error('[EmployeeDashboardStore] fetch failed', error)
      runInAction(() => this.loadingStage.error())
    }
  }

  async confirmSchedule(): Promise<boolean> {
    if (this.confirmStage.isLoading) return false
    this.confirmStage.loading()
    runInAction(() => {
      this.lastConfirmError = null
    })
    try {
      const result = await confirmEmployeeSchedule(this.employeeId)
      runInAction(() => {
        const current = this.schedule.value
        if (current) {
          this.schedule.change({ ...current, confirmedAt: result.confirmedAt })
        }
        this.confirmStage.success()
      })
      return true
    } catch (error) {
      console.error('[EmployeeDashboardStore] confirmSchedule failed', error)
      const message = error instanceof Error ? error.message : 'Не удалось подтвердить график'
      runInAction(() => {
        this.lastConfirmError = message
        this.confirmStage.error()
      })
      return false
    }
  }
}

function toLocalDateKey(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function getMondayOfCurrentWeek(): Date {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const dow = today.getDay() // 0=Sun
  const diffToMonday = (dow + 6) % 7
  today.setDate(today.getDate() - diffToMonday)
  return today
}
