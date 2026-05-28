import { makeAutoObservable, runInAction } from 'mobx'

import { uploadActivityEventsCsv, uploadActivityEventsJson } from '@/entities/activity-event/api'
import { ActivityEventImportResult } from '@/entities/activity-event/model/types'
import { postSeedDemo } from '@/entities/admin/api'
import { getDashboardSummary, normalizeDashboardSummary } from '@/entities/dashboard/api'
import { DashboardSummary, DashboardSummaryRaw } from '@/entities/dashboard/model/types'
import { getEmployees } from '@/entities/employee/api'
import { LoadingStageModel, ValueModel } from '@/shared/model'
import { buildSampleActivityEvents } from '@/widgets/DataUploader/sampleData'

export type ImportSource = 'Календарь' | 'HR-система' | 'Таск-трекер' | 'Табель'

export interface ImportHistoryRow {
  id: string
  source: ImportSource
  file: string
  date: string
  status: 'ok' | 'partial' | 'error'
}

function newId(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `row-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function formatDate(): string {
  return new Date().toLocaleString('ru-RU')
}

function statusFromResult(result: ActivityEventImportResult): ImportHistoryRow['status'] {
  if (result.importedCount === 0) return 'error'
  if (result.errors.length > 0) return 'partial'
  return 'ok'
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return 'Не удалось загрузить данные'
}

export class DashboardStore {
  summary = new ValueModel<DashboardSummary | null>(null)
  loadingStage = new LoadingStageModel()

  uploadStage = new LoadingStageModel()
  lastImportResult: ActivityEventImportResult | null = null
  lastImportError: string | null = null

  importHistory: ImportHistoryRow[] = []

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

  /** Заполнить стор данными, полученными на сервере (SSR/ISR). Идемпотентно. */
  hydrate(raw: DashboardSummaryRaw): void {
    if (this.loadingStage.isSuccessful) return
    runInAction(() => {
      this.summary.change(normalizeDashboardSummary(raw))
      this.loadingStage.success()
    })
  }

  async uploadCsv(source: ImportSource, file: File): Promise<void> {
    await this._runUpload(source, file.name, () => uploadActivityEventsCsv(file))
  }

  async uploadJson(source: ImportSource, payload: unknown[], fileLabel: string): Promise<void> {
    await this._runUpload(source, fileLabel, () => uploadActivityEventsJson(payload))
  }

  async generateSample(source: ImportSource): Promise<void> {
    if (this.uploadStage.isLoading) return
    this.uploadStage.loading()
    runInAction(() => {
      this.lastImportError = null
    })
    try {
      // Smart fallback: пустая БД → полный seed-набор; иначе — клиентские sample-события.
      const employees = await getEmployees()
      if (employees.length === 0) {
        const seed = await postSeedDemo({ small: true, reset: false, withRoadmap: true })
        runInAction(() => {
          this.lastImportResult = null
          this.importHistory = [
            {
              id: newId(),
              source,
              file: `Создан demo-набор: ${seed.employeesCreated} сотрудников, ${seed.eventsCreated} событий`,
              date: formatDate(),
              status: 'ok',
            },
            ...this.importHistory,
          ]
          this.uploadStage.success()
        })
        void this.fetch()
        return
      }
      const events = await buildSampleActivityEvents()
      const result = await uploadActivityEventsJson(events)
      runInAction(() => {
        this.lastImportResult = result
        this.importHistory = [
          {
            id: newId(),
            source,
            file: `Сгенерировано ${events.length} событий`,
            date: formatDate(),
            status: statusFromResult(result),
          },
          ...this.importHistory,
        ]
        this.uploadStage.success()
      })
      void this.fetch()
    } catch (error) {
      console.error('[DashboardStore] generateSample failed', error)
      const message = getErrorMessage(error)
      runInAction(() => {
        this.lastImportError = message
        this.lastImportResult = null
        this.importHistory = [
          {
            id: newId(),
            source,
            file: 'Тестовые данные',
            date: formatDate(),
            status: 'error',
          },
          ...this.importHistory,
        ]
        this.uploadStage.error()
      })
    }
  }

  reportLocalError(source: ImportSource, fileLabel: string, message: string): void {
    runInAction(() => {
      this.lastImportError = message
      this.lastImportResult = null
      this.importHistory = [
        {
          id: newId(),
          source,
          file: fileLabel,
          date: formatDate(),
          status: 'error',
        },
        ...this.importHistory,
      ]
      this.uploadStage.error()
    })
  }

  private async _runUpload(
    source: ImportSource,
    fileLabel: string,
    fn: () => Promise<ActivityEventImportResult>
  ): Promise<void> {
    if (this.uploadStage.isLoading) return
    this.uploadStage.loading()
    runInAction(() => {
      this.lastImportError = null
    })
    try {
      const result = await fn()
      runInAction(() => {
        this.lastImportResult = result
        this.importHistory = [
          {
            id: newId(),
            source,
            file: fileLabel,
            date: formatDate(),
            status: statusFromResult(result),
          },
          ...this.importHistory,
        ]
        this.uploadStage.success()
      })
      void this.fetch()
    } catch (error) {
      console.error('[DashboardStore] upload failed', error)
      const message = getErrorMessage(error)
      runInAction(() => {
        this.lastImportError = message
        this.lastImportResult = null
        this.importHistory = [
          {
            id: newId(),
            source,
            file: fileLabel,
            date: formatDate(),
            status: 'error',
          },
          ...this.importHistory,
        ]
        this.uploadStage.error()
      })
    }
  }
}
