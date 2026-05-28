import { makeAutoObservable, runInAction } from 'mobx'

import { getConflictAlternatives, getConflicts, proposeReschedule } from '@/entities/conflict/api'
import {
  AlternativeWindow,
  ConflictEvent,
  ConflictListFilters,
  ProposeReschedulePayload,
} from '@/entities/conflict/model/types'
import { LoadingStageModel, ValueModel } from '@/shared/model'

const DEFAULT_LIMIT = 50

export class ConflictsStore {
  items = new ValueModel<ConflictEvent[]>([])
  total = new ValueModel<number>(0)
  loadingStage = new LoadingStageModel()

  filters = {
    teamId: new ValueModel<string | null>(null),
    employeeId: new ValueModel<string | null>(null),
    rangeStart: new ValueModel<string | null>(null),
    rangeEnd: new ValueModel<string | null>(null),
    search: new ValueModel<string>(''),
  }

  pagination = {
    limit: new ValueModel<number>(DEFAULT_LIMIT),
    offset: new ValueModel<number>(0),
  }

  selectedEvent = new ValueModel<ConflictEvent | null>(null)
  alternatives = new ValueModel<AlternativeWindow[]>([])
  alternativesLoadingStage = new LoadingStageModel()
  proposedKeys = new ValueModel<Set<string>>(new Set<string>())

  constructor() {
    makeAutoObservable(this)
  }

  async fetch(): Promise<void> {
    if (this.loadingStage.isLoading) return
    this.loadingStage.loading()
    try {
      const res = await getConflicts(this.currentFilters)
      runInAction(() => {
        this.items.change(res.items)
        this.total.change(res.total)
        this.loadingStage.success()
      })
    } catch (error) {
      console.error('[ConflictsStore] fetch failed', error)
      runInAction(() => this.loadingStage.error())
    }
  }

  resetFilters(): void {
    runInAction(() => {
      this.filters.teamId.change(null)
      this.filters.employeeId.change(null)
      this.filters.rangeStart.change(null)
      this.filters.rangeEnd.change(null)
      this.filters.search.change('')
      this.pagination.offset.change(0)
    })
  }

  setOffset(offset: number): void {
    this.pagination.offset.change(Math.max(offset, 0))
  }

  get currentFilters(): ConflictListFilters {
    return {
      teamId: this.filters.teamId.value,
      employeeId: this.filters.employeeId.value,
      rangeStart: this.filters.rangeStart.value,
      rangeEnd: this.filters.rangeEnd.value,
      search: this.filters.search.value,
      limit: this.pagination.limit.value,
      offset: this.pagination.offset.value,
    }
  }

  async openDrawer(event: ConflictEvent): Promise<void> {
    runInAction(() => {
      this.selectedEvent.change(event)
      this.alternatives.change([])
      this.alternativesLoadingStage.reset()
    })
    await this.loadAlternatives(event.id)
  }

  closeDrawer(): void {
    runInAction(() => {
      this.selectedEvent.change(null)
      this.alternatives.change([])
      this.alternativesLoadingStage.reset()
    })
  }

  async loadAlternatives(eventId: string): Promise<void> {
    if (this.alternativesLoadingStage.isLoading) return
    this.alternativesLoadingStage.loading()
    try {
      const data = await getConflictAlternatives(eventId)
      runInAction(() => {
        this.alternatives.change(data)
        this.alternativesLoadingStage.success()
      })
    } catch (error) {
      console.error('[ConflictsStore] loadAlternatives failed', error)
      runInAction(() => this.alternativesLoadingStage.error())
    }
  }

  async propose(eventId: string, payload: ProposeReschedulePayload): Promise<void> {
    await proposeReschedule(eventId, payload)
    runInAction(() => {
      const next = new Set(this.proposedKeys.value)
      next.add(_proposedKey(eventId, payload))
      this.proposedKeys.change(next)
    })
  }

  isProposed(eventId: string, alt: AlternativeWindow): boolean {
    return this.proposedKeys.value.has(
      _proposedKey(eventId, {
        alternative_start_dt: alt.startDt,
        alternative_end_dt: alt.endDt,
      })
    )
  }
}

function _proposedKey(eventId: string, payload: ProposeReschedulePayload): string {
  return `${eventId}|${payload.alternative_start_dt}|${payload.alternative_end_dt}`
}
