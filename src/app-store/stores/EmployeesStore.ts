import { makeObservable, observable, runInAction } from 'mobx'

import { getEmployees } from '@/entities/employee/api'
import { Employee, RiskLevel, WorkFormat } from '@/entities/employee/model/types'
import { ListModel, ValueModel } from '@/shared/model'

export type DiagnosticsCategory =
  | 'actual'
  | 'outdated'
  | 'outside_schedule'
  | 'overloaded'
  | 'pending_confirmation'

const CATEGORIES_ORDER: DiagnosticsCategory[] = [
  'actual',
  'outdated',
  'outside_schedule',
  'overloaded',
  'pending_confirmation',
]

export const CATEGORY_LABEL_RU: Record<DiagnosticsCategory, string> = {
  actual: 'Актуальны',
  outdated: 'Устаревший',
  outside_schedule: 'Встречи вне графика',
  overloaded: 'Высокая нагрузка',
  pending_confirmation: 'Нужно подтвердить',
}

export class EmployeesStore {
  list = new ListModel<Employee, string>({ keys: [], entities: new Map() })

  filters = {
    teamId: new ValueModel<string | null>(null),
    riskLevel: new ValueModel<RiskLevel | null>(null),
    workFormat: new ValueModel<WorkFormat | null>(null),
  }

  constructor() {
    makeObservable(this, {
      filters: observable,
    })
  }

  async fetch(): Promise<void> {
    if (this.list.loadingStage.isLoading) return
    this.list.loadingStage.loading()
    try {
      const data = await getEmployees()
      runInAction(() => {
        this.list.fillByRawData(data, (raw) => ({ entity: raw, key: raw.id }), true)
        this.list.loadingStage.success()
      })
    } catch (error) {
      console.error('[EmployeesStore] fetch failed', error)
      runInAction(() => this.list.loadingStage.error())
    }
  }

  get filteredItems(): Employee[] {
    const { teamId, riskLevel, workFormat } = this.filters
    return this.list.items.filter((e) => {
      if (teamId.value && !e.teamIds.includes(teamId.value)) return false
      if (riskLevel.value && e.metric?.riskLevel !== riskLevel.value) return false
      if (workFormat.value && e.workFormat !== workFormat.value) return false
      return true
    })
  }

  /** Топ-5 для AttentionList — критические + высокие */
  get attentionEmployees(): Employee[] {
    return [...this.list.items]
      .filter(
        (e) => e.metric && (e.metric.riskLevel === 'critical' || e.metric.riskLevel === 'high')
      )
      .sort((a, b) => (b.metric?.riskScore ?? 0) - (a.metric?.riskScore ?? 0))
      .slice(0, 5)
  }

  /** Группировка для kanban-доски Diagnostics */
  get byCategory(): Record<DiagnosticsCategory, Employee[]> {
    const result: Record<DiagnosticsCategory, Employee[]> = {
      actual: [],
      outdated: [],
      outside_schedule: [],
      overloaded: [],
      pending_confirmation: [],
    }

    for (const emp of this.filteredItems) {
      const m = emp.metric
      if (!m) continue

      if (m.daysSinceUpdate >= 60) {
        result.outdated.push(emp)
      } else if (m.loadLevel > 0.8) {
        result.overloaded.push(emp)
      } else if (m.conflictRate >= 0.35) {
        result.outside_schedule.push(emp)
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
    if (m.loadLevel > 0.8) return `Li = ${m.loadLevel.toFixed(2)} · высокая нагрузка`
    if (m.conflictRate >= 0.35)
      return `Ci = ${Math.round(m.conflictRate * 100)}% встреч вне графика`
    return ''
  }
}
