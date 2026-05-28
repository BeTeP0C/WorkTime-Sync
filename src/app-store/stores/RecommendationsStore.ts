import { makeAutoObservable, observable, runInAction } from 'mobx'

import {
  bulkUpdateRecommendationStatus,
  getEmployeeRecommendations,
  getRecommendations,
  patchRecommendationStatus,
} from '@/entities/recommendation/api'
import {
  BackendRoadmapStatus,
  Recommendation,
  RecommendationCode,
  RecommendationSeverity,
  RecommendationTargetStatus,
} from '@/entities/recommendation/model/types'
import { ListModel, ValueModel } from '@/shared/model'

export type RecommendationCategory = 'schedule' | 'meeting' | 'load' | 'tz'

export type LocalStatus = 'active' | 'done' | 'deferred' | 'ignored'

export const CATEGORY_LABEL_RU: Record<RecommendationCategory, string> = {
  schedule: 'Обновить график',
  meeting: 'Перенести встречу',
  load: 'Снизить нагрузку',
  tz: 'Часовой пояс',
}

const CODE_TO_CATEGORY: Record<RecommendationCode, RecommendationCategory> = {
  outdated_schedule: 'schedule',
  events_outside_schedule: 'meeting',
  high_conflict_rate: 'load',
  high_load_level: 'load',
  high_risk_score: 'load',
  timezone_mismatch_suspicion: 'tz',
}

export const CATEGORIES_ORDER: RecommendationCategory[] = ['schedule', 'meeting', 'load', 'tz']

export function getRecommendationCategory(code: RecommendationCode): RecommendationCategory {
  return CODE_TO_CATEGORY[code]
}

export function getRecommendationKey(rec: Recommendation): string {
  return `${rec.code}:${rec.subjectType}:${rec.subjectId}`
}

const MOCK_TOTAL_MONTH = 26
const MOCK_DONE_THIS_WEEK = 8

const LOCAL_STATUS_TO_TARGET: Record<Exclude<LocalStatus, 'active'>, RecommendationTargetStatus> = {
  done: 'requested',
  deferred: 'deferred',
  ignored: 'ignored',
}

function backendStatusToLocal(status: BackendRoadmapStatus | null): LocalStatus {
  if (status === null || status === 'pending') return 'active'
  if (status === 'deferred') return 'deferred'
  if (status === 'ignored' || status === 'dismissed') return 'ignored'
  // requested / acknowledged / updated / completed
  return 'done'
}

export class RecommendationsStore {
  list = new ListModel<Recommendation, string>({ keys: [], entities: new Map() })

  filterCategory = new ValueModel<RecommendationCategory | null>(null)
  filterTeamId = new ValueModel<string | null>(null)

  statuses = observable.map<string, LocalStatus>()

  constructor() {
    makeAutoObservable(this, { list: false, statuses: false })
  }

  async fetch(employeeId?: string): Promise<void> {
    if (this.list.loadingStage.isLoading) return
    this.list.loadingStage.loading()
    try {
      const data = employeeId
        ? await getEmployeeRecommendations(employeeId)
        : await getRecommendations()
      runInAction(() => {
        this.list.fillByRawData(
          data,
          (raw) => ({ entity: raw, key: getRecommendationKey(raw) }),
          true
        )
        this.statuses.clear()
        for (const rec of data) {
          const local = backendStatusToLocal(rec.status)
          if (local !== 'active') {
            this.statuses.set(getRecommendationKey(rec), local)
          }
        }
        this.list.loadingStage.success()
      })
    } catch (error) {
      console.error('[RecommendationsStore] fetch failed', error)
      runInAction(() => this.list.loadingStage.error())
    }
  }

  setStatus = async (rec: Recommendation, status: LocalStatus): Promise<void> => {
    const key = getRecommendationKey(rec)
    if (status === 'active') {
      // Нет «обратно в active» из UI — кнопок таких нет. Просто игнорируем.
      return
    }
    const previous = this.statuses.get(key)
    runInAction(() => this.statuses.set(key, status))
    try {
      const target = LOCAL_STATUS_TO_TARGET[status]
      const updated = await patchRecommendationStatus(
        rec.code,
        rec.subjectType,
        rec.subjectId,
        target
      )
      runInAction(() => {
        this.statuses.set(key, backendStatusToLocal(updated.status))
      })
    } catch (error) {
      console.error('[RecommendationsStore] setStatus failed', error)
      runInAction(() => {
        if (previous === undefined) {
          this.statuses.delete(key)
        } else {
          this.statuses.set(key, previous)
        }
      })
    }
  }

  getStatus(rec: Recommendation): LocalStatus {
    return this.statuses.get(getRecommendationKey(rec)) ?? 'active'
  }

  bulkResolveCritical = async (): Promise<void> => {
    // Optimistic: подсветить все critical-active как done сразу.
    const targets: Recommendation[] = []
    runInAction(() => {
      for (const rec of this.list.items) {
        if (rec.severity === 'critical' && this.getStatus(rec) === 'active') {
          this.statuses.set(getRecommendationKey(rec), 'done')
          targets.push(rec)
        }
      }
    })
    if (targets.length === 0) return
    try {
      await bulkUpdateRecommendationStatus({ status: 'requested', severity: 'critical' })
      await this.fetch()
    } catch (error) {
      console.error('[RecommendationsStore] bulkResolveCritical failed', error)
      runInAction(() => {
        for (const rec of targets) {
          this.statuses.delete(getRecommendationKey(rec))
        }
      })
    }
  }

  get activeItems(): Recommendation[] {
    return this.list.items.filter((rec) => this.getStatus(rec) === 'active')
  }

  get filteredItems(): Recommendation[] {
    const category = this.filterCategory.value
    if (!category) return this.activeItems
    return this.activeItems.filter((rec) => getRecommendationCategory(rec.code) === category)
  }

  get countsByCategory(): Record<RecommendationCategory, number> {
    const result: Record<RecommendationCategory, number> = {
      schedule: 0,
      meeting: 0,
      load: 0,
      tz: 0,
    }
    for (const rec of this.activeItems) {
      result[getRecommendationCategory(rec.code)] += 1
    }
    return result
  }

  get countsBySeverity(): Record<RecommendationSeverity, number> {
    const result: Record<RecommendationSeverity, number> = { medium: 0, high: 0, critical: 0 }
    for (const rec of this.activeItems) {
      result[rec.severity] += 1
    }
    return result
  }

  get activeCount(): number {
    return this.activeItems.length
  }

  get doneCount(): number {
    return [...this.statuses.values()].filter((s) => s === 'done').length
  }

  get deferredCount(): number {
    return [...this.statuses.values()].filter((s) => s === 'deferred').length
  }

  get monthTotal(): number {
    // TODO(backend): реальный план на месяц
    return MOCK_TOTAL_MONTH
  }

  get doneThisWeek(): number {
    // TODO(backend): /recommendations/stats?period=week
    return MOCK_DONE_THIS_WEEK
  }
}
