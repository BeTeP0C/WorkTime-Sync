import { makeAutoObservable, runInAction } from 'mobx'

import { getDashboardSummary } from '@/entities/dashboard/api'
import { DashboardSummary } from '@/entities/dashboard/model/types'
import { LoadingStageModel, ValueModel } from '@/shared/model'

export interface ImportHistoryRow {
  id: string
  source: 'Календарь' | 'HR-система' | 'Таск-трекер' | 'Табель'
  file: string
  date: string
  status: 'ok' | 'partial' | 'error'
}

export class DashboardStore {
  summary = new ValueModel<DashboardSummary | null>(null)
  loadingStage = new LoadingStageModel()

  importHistory: ImportHistoryRow[] = [
    { id: '1', source: 'Календарь', file: 'calendar_may.csv', date: '20 мая', status: 'ok' },
    { id: '2', source: 'HR-система', file: 'hr_export.json', date: '18 мая', status: 'ok' },
    { id: '3', source: 'Таск-трекер', file: 'tasks_q2.csv', date: '15 мая', status: 'partial' },
    { id: '4', source: 'Табель', file: 'timesheet_apr.csv', date: '02 мая', status: 'error' },
  ]

  constructor() {
    makeAutoObservable(this)
  }

  async fetch(): Promise<void> {
    if (this.loadingStage.isLoading) return
    this.loadingStage.loading()
    try {
      const data = await getDashboardSummary()
      runInAction(() => {
        this.summary.change(data)
        this.loadingStage.success()
      })
    } catch (error) {
      console.error('[DashboardStore] fetch failed', error)
      runInAction(() => this.loadingStage.error())
    }
  }
}
