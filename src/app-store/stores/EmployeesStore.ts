import { makeObservable, observable, runInAction } from 'mobx'

import {
  createEmployeeFull,
  CreateEmployeeFullPayload,
  EmployeeCategoryFilter,
  EmployeeListFilters,
  getEmployees,
  getEmployeesPaginated,
} from '@/entities/employee/api'
import { normalizeEmployee } from '@/entities/employee/lib/normalize'
import { Employee, EmployeeRaw, RiskLevel, WorkFormat } from '@/entities/employee/model/types'
import { ListModel, ValueModel } from '@/shared/model'

export type DiagnosticsCategory =
  | 'actual'
  | 'outdated'
  | 'outside_schedule'
  | 'overloaded'
  | 'in_absence'
  | 'hr_calendar_conflict'
  | 'timezone_conflict'
  | 'needs_review'
  | 'pending_confirmation'
  | 'no_response'

const CATEGORIES_ORDER: DiagnosticsCategory[] = [
  'actual',
  'outdated',
  'outside_schedule',
  'overloaded',
  'in_absence',
  'hr_calendar_conflict',
  'timezone_conflict',
  'needs_review',
  'pending_confirmation',
  'no_response',
]

export const CATEGORY_LABEL_RU: Record<DiagnosticsCategory, string> = {
  actual: 'Актуальны',
  outdated: 'Устаревшие',
  outside_schedule: 'Встречи вне графика',
  overloaded: 'Высокая нагрузка',
  in_absence: 'Сейчас отсутствуют',
  hr_calendar_conflict: 'Конфликт HR↔календарь',
  timezone_conflict: 'Конфликт часового пояса',
  needs_review: 'Нужен пересмотр',
  pending_confirmation: 'Нужно подтвердить',
  no_response: 'Нет ответа',
}

export class EmployeesStore {
  list = new ListModel<Employee, string>({ keys: [], entities: new Map() })

  filters = {
    teamId: new ValueModel<string | null>(null),
    riskLevel: new ValueModel<RiskLevel | null>(null),
    workFormat: new ValueModel<WorkFormat | null>(null),
    search: new ValueModel<string>(''),
    category: new ValueModel<EmployeeCategoryFilter | null>(null),
  }

  /** Состояние пагинации для /employees. На других экранах не используется. */
  pagination = {
    page: new ValueModel<number>(1),
    pageSize: new ValueModel<number>(6),
    total: new ValueModel<number>(0),
  }

  /** Полный список без фильтров — для счётчиков quick-chips на /employees.
   *  Заполняется отдельным fetchCounts(); не зависит от текущих фильтров. */
  countsAll = new ValueModel<Employee[]>([])
  countsInAbsence = new ValueModel<number>(0)

  constructor() {
    makeObservable(this, {
      filters: observable,
      pagination: observable,
      countsAll: observable,
      countsInAbsence: observable,
    })
  }

  /** Подтянуть список с текущими фильтрами в сторе. Перезаписывает items. */
  async fetch(): Promise<void> {
    if (this.list.loadingStage.isLoading) return
    this.list.loadingStage.loading()
    try {
      const data = await getEmployees(this.currentFilters)
      runInAction(() => {
        this.list.fillByRawData(data, (raw) => ({ entity: raw, key: raw.id }), true)
        this.list.loadingStage.success()
      })
    } catch (error) {
      console.error('[EmployeesStore] fetch failed', error)
      runInAction(() => this.list.loadingStage.error())
    }
  }

  /** Создание сотрудника через wizard «Добавить сотрудника» (employee + schedule + team
   *  одной транзакцией на бэке). Добавляет результат в начало списка стора. */
  async createFull(payload: CreateEmployeeFullPayload): Promise<Employee> {
    const employee = await createEmployeeFull(payload)
    runInAction(() => {
      this.list.addEntity({ entity: employee, key: employee.id, start: true })
    })
    return employee
  }

  /** Заполнить стор данными SSR. Сами фильтры в этом случае пустые, т.к. SSR
   *  всегда тянет полный список. */
  hydrate(raw: EmployeeRaw[]): void {
    if (this.list.loadingStage.isSuccessful) return
    const employees = raw.map(normalizeEmployee)
    runInAction(() => {
      this.list.fillByRawData(employees, (e) => ({ entity: e, key: e.id }), true)
      this.list.loadingStage.success()
    })
  }

  /** Сброс всех фильтров и search. Не вызывает fetch — это решает компонент. */
  resetFilters(): void {
    runInAction(() => {
      this.filters.teamId.change(null)
      this.filters.riskLevel.change(null)
      this.filters.workFormat.change(null)
      this.filters.search.change('')
      this.filters.category.change(null)
    })
  }

  get currentFilters(): EmployeeListFilters {
    const cat = this.filters.category.value
    return {
      teamId: this.filters.teamId.value,
      riskLevel: this.filters.riskLevel.value,
      workFormat: this.filters.workFormat.value,
      search: this.filters.search.value,
      category: cat,
    }
  }

  /** Постраничный fetch для /employees — пишет items + total из X-Total-Count. */
  async fetchPage(): Promise<void> {
    if (this.list.loadingStage.isLoading) return
    this.list.loadingStage.loading()
    const page = this.pagination.page.value
    const pageSize = this.pagination.pageSize.value
    try {
      const { items, total } = await getEmployeesPaginated(
        this.currentFilters,
        (page - 1) * pageSize,
        pageSize
      )
      runInAction(() => {
        this.list.fillByRawData(items, (raw) => ({ entity: raw, key: raw.id }), true)
        this.pagination.total.change(total)
        this.list.loadingStage.success()
      })
    } catch (error) {
      console.error('[EmployeesStore] fetchPage failed', error)
      runInAction(() => this.list.loadingStage.error())
    }
  }

  /** Грузит полный список без фильтров для quick-chips счётчиков на /employees.
   *  Отдельный fetch — не зависит от текущих фильтров. */
  async fetchCounts(): Promise<void> {
    try {
      const [all, inAbsence] = await Promise.all([
        getEmployees(),
        getEmployees({ category: 'in_absence' }),
      ])
      runInAction(() => {
        this.countsAll.change(all)
        this.countsInAbsence.change(inAbsence.length)
      })
    } catch (error) {
      console.error('[EmployeesStore] fetchCounts failed', error)
    }
  }

  /** Топ-5 для AttentionList — критические + высокие. Считается на фронте поверх
   *  уже загруженного списка (то есть зависит от текущих фильтров). */
  get attentionEmployees(): Employee[] {
    return [...this.list.items]
      .filter(
        (e) => e.metric && (e.metric.riskLevel === 'critical' || e.metric.riskLevel === 'high')
      )
      .sort((a, b) => (b.metric?.riskScore ?? 0) - (a.metric?.riskScore ?? 0))
      .slice(0, 5)
  }

  /** Топ-5 для HR-таблицы «Статус актуальности данных» — сортировка по
   *  actualityScore по возрастанию (хуже всего сверху). */
  get lowestActualityEmployees(): Employee[] {
    return [...this.list.items]
      .filter((e) => e.metric)
      .sort((a, b) => (a.metric?.actualityScore ?? 1) - (b.metric?.actualityScore ?? 1))
      .slice(0, 5)
  }

  /** Распределение сотрудников по формату работы для HR-виджета «Форматы работы». */
  get byWorkFormat(): Record<WorkFormat, number> {
    const result: Record<WorkFormat, number> = { office: 0, remote: 0, hybrid: 0 }
    for (const emp of this.list.items) {
      result[emp.workFormat] = (result[emp.workFormat] ?? 0) + 1
    }
    return result
  }

  /** Группировка для kanban-доски Diagnostics — считается поверх загруженного списка.
   *  Сотрудник попадает в первую подходящую категорию (порядок важен — от самой
   *  острой проблемы к самой «мягкой»). */
  get byCategory(): Record<DiagnosticsCategory, Employee[]> {
    const result: Record<DiagnosticsCategory, Employee[]> = {
      actual: [],
      outdated: [],
      outside_schedule: [],
      overloaded: [],
      in_absence: [],
      hr_calendar_conflict: [],
      timezone_conflict: [],
      needs_review: [],
      pending_confirmation: [],
      no_response: [],
    }

    for (const emp of this.list.items) {
      const m = emp.metric
      if (!m) continue

      if (emp.hasPendingConfirmation) {
        result.no_response.push(emp)
      } else if (m.daysSinceUpdate >= 60) {
        result.outdated.push(emp)
      } else if (m.hrFactor >= 0.5) {
        result.hr_calendar_conflict.push(emp)
      } else if (m.zoneFactor >= 0.3) {
        result.timezone_conflict.push(emp)
      } else if (m.loadLevel > 0.8) {
        result.overloaded.push(emp)
      } else if (m.conflictRate >= 0.35) {
        result.outside_schedule.push(emp)
      } else if (m.actualityScore < 0.4 || m.conflictRate > 0.5) {
        result.needs_review.push(emp)
      } else if (m.riskLevel === 'medium') {
        result.pending_confirmation.push(emp)
      } else {
        result.actual.push(emp)
      }
    }

    return result
  }

  get categoriesOrder(): DiagnosticsCategory[] {
    return CATEGORIES_ORDER
  }

  /** Краткое объяснение почему сотрудник в категории — для UI */
  attentionReason(emp: Employee): string {
    const m = emp.metric
    if (!m) return ''
    if (m.daysSinceUpdate >= 90) return `${m.daysSinceUpdate} дней без обновления`
    if (m.daysSinceUpdate >= 60) return `${m.daysSinceUpdate} дней без обновления`
    if (m.loadLevel > 1.0) return `Li = ${m.loadLevel.toFixed(2)} · перегружен`
    if (m.loadLevel > 0.8) return `Li = ${m.loadLevel.toFixed(2)} · перегружен`
    if (m.conflictRate >= 0.35)
      return `Ci = ${Math.round(m.conflictRate * 100)}% встреч вне графика`
    return ''
  }
}
