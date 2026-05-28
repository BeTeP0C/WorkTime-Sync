import { makeAutoObservable, runInAction } from 'mobx'

import {
  deleteRoadmapItem,
  generateRoadmap,
  getRoadmap,
  updateRoadmapItem,
  updateRoadmapStatus,
} from '@/entities/roadmap/api'
import {
  RoadmapGenerateResponse,
  RoadmapItem,
  RoadmapSeverity,
  RoadmapStatus,
} from '@/entities/roadmap/model/types'
import { ListModel, LoadingStageModel, ValueModel } from '@/shared/model'

export type RoadmapSort = 'priority_desc' | 'due_asc' | 'created_desc'

type StatusCounts = Record<RoadmapStatus, number>
type SeverityCounts = Record<RoadmapSeverity, number>

const EMPTY_STATUS_COUNTS: StatusCounts = {
  pending: 0,
  requested: 0,
  acknowledged: 0,
  updated: 0,
  completed: 0,
  deferred: 0,
  ignored: 0,
  dismissed: 0,
}

const EMPTY_SEVERITY_COUNTS: SeverityCounts = {
  critical: 0,
  high: 0,
  medium: 0,
  low: 0,
}

export class RoadmapStore {
  list = new ListModel<RoadmapItem, string>({ keys: [], entities: new Map() })

  filterStatuses = new ValueModel<RoadmapStatus[]>([])
  filterSeverities = new ValueModel<RoadmapSeverity[]>([])
  filterSubjectType = new ValueModel<'employee' | 'team' | null>(null)
  filterTeamId = new ValueModel<string | null>(null)
  search = new ValueModel<string>('')
  sort = new ValueModel<RoadmapSort>('priority_desc')
  includeClosed = new ValueModel<boolean>(false)

  generateLoading = new LoadingStageModel()

  countsByStatus: StatusCounts = { ...EMPTY_STATUS_COUNTS }
  countsBySeverity: SeverityCounts = { ...EMPTY_SEVERITY_COUNTS }
  total = 0

  constructor() {
    makeAutoObservable(this, { list: false, generateLoading: false })
  }

  async fetch(): Promise<void> {
    if (this.list.loadingStage.isLoading) return
    this.list.loadingStage.loading()
    try {
      const data = await getRoadmap({
        status: this.filterStatuses.value.length ? this.filterStatuses.value : undefined,
        severity: this.filterSeverities.value.length ? this.filterSeverities.value : undefined,
        subjectType: this.filterSubjectType.value,
        teamId: this.filterTeamId.value,
        search: this.search.value || undefined,
        includeClosed: this.includeClosed.value,
        limit: 100,
      })
      runInAction(() => {
        this.list.fillByRawData(data.items, (raw) => ({ entity: raw, key: raw.id }), true)
        this.countsByStatus = data.countsByStatus
        this.countsBySeverity = data.countsBySeverity
        this.total = data.total
        this.list.loadingStage.success()
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[RoadmapStore] fetch failed', error)
      runInAction(() => this.list.loadingStage.error())
    }
  }

  async setStatus(
    item: RoadmapItem,
    status: RoadmapStatus,
    notes?: string
  ): Promise<RoadmapItem | null> {
    try {
      const updated = await updateRoadmapStatus(item.id, status, notes)
      runInAction(() => {
        this.list.addEntity({ entity: updated, key: updated.id })
        // refresh counts
        if (this.countsByStatus[item.status] > 0) this.countsByStatus[item.status] -= 1
        this.countsByStatus[updated.status] += 1
      })
      return updated
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[RoadmapStore] setStatus failed', error)
      return null
    }
  }

  async generate(scope?: {
    teamId?: string
    employeeId?: string
  }): Promise<RoadmapGenerateResponse | null> {
    if (this.generateLoading.isLoading) return null
    this.generateLoading.loading()
    try {
      const result = await generateRoadmap(scope)
      runInAction(() => {
        this.generateLoading.success()
      })
      await this.fetch()
      return result
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[RoadmapStore] generate failed', error)
      runInAction(() => this.generateLoading.error())
      return null
    }
  }

  async updateItem(
    item: RoadmapItem,
    patch: { notes?: string; dueAt?: string; assignedToId?: string }
  ): Promise<RoadmapItem | null> {
    try {
      const updated = await updateRoadmapItem(item.id, patch)
      runInAction(() => {
        this.list.addEntity({ entity: updated, key: updated.id })
      })
      return updated
    } catch (error) {
      console.error('[RoadmapStore] updateItem failed', error)
      return null
    }
  }

  async deleteItem(item: RoadmapItem): Promise<void> {
    try {
      await deleteRoadmapItem(item.id)
      runInAction(() => {
        this.list.removeEntity(item.id)
        if (this.countsByStatus[item.status] > 0) this.countsByStatus[item.status] -= 1
      })
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('[RoadmapStore] delete failed', error)
    }
  }

  get sortedItems(): RoadmapItem[] {
    const items = this.list.items.slice()
    switch (this.sort.value) {
      case 'due_asc':
        return items.sort((a, b) => {
          if (!a.dueAt) return 1
          if (!b.dueAt) return -1
          return a.dueAt.localeCompare(b.dueAt)
        })
      case 'created_desc':
        return items.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      case 'priority_desc':
      default:
        return items.sort((a, b) => b.priorityScore - a.priorityScore)
    }
  }

  get pendingCount(): number {
    return this.countsByStatus.pending
  }

  get requestedCount(): number {
    return this.countsByStatus.requested
  }

  get acknowledgedCount(): number {
    return this.countsByStatus.acknowledged
  }

  get completedCount(): number {
    return this.countsByStatus.completed
  }

  toggleStatusFilter(status: RoadmapStatus): void {
    const current = this.filterStatuses.value
    if (current.includes(status)) {
      this.filterStatuses.change(current.filter((s) => s !== status))
    } else {
      this.filterStatuses.change([...current, status])
    }
  }

  toggleSeverityFilter(severity: RoadmapSeverity): void {
    const current = this.filterSeverities.value
    if (current.includes(severity)) {
      this.filterSeverities.change(current.filter((s) => s !== severity))
    } else {
      this.filterSeverities.change([...current, severity])
    }
  }

  resetFilters(): void {
    this.filterStatuses.change([])
    this.filterSeverities.change([])
    this.filterSubjectType.change(null)
    this.search.change('')
  }
}
