import { makeAutoObservable, runInAction } from 'mobx'

import { getEmployeeEvents } from '@/entities/activity-event/api'
import { ActivityEvent } from '@/entities/activity-event/model/types'
import {
  createScheduleException,
  CreateScheduleExceptionPayload,
  deleteScheduleException,
  getEmployeeExceptions,
  updateScheduleException,
  UpdateScheduleExceptionPayload,
} from '@/entities/exception/api'
import { ScheduleException } from '@/entities/exception/model/types'
import { ApiError } from '@/shared/api/client'
import { LoadingStageModel, ValueModel } from '@/shared/model'

export class MyExceptionsStore {
  employeeId: string
  exceptions = new ValueModel<ScheduleException[]>([])
  events = new ValueModel<ActivityEvent[]>([])
  loadingStage = new LoadingStageModel()
  submitStage = new LoadingStageModel()
  lastError: string | null = null

  constructor(employeeId: string) {
    this.employeeId = employeeId
    makeAutoObservable(this)
  }

  get activeAndUpcoming(): ScheduleException[] {
    return this.exceptions.value
      .filter((e) => e.status !== 'completed')
      .slice()
      .sort((a, b) => Date.parse(a.startDt) - Date.parse(b.startDt))
  }

  get past(): ScheduleException[] {
    return this.exceptions.value
      .filter((e) => e.status === 'completed')
      .slice()
      .sort((a, b) => Date.parse(b.startDt) - Date.parse(a.startDt))
  }

  async fetch(): Promise<void> {
    if (this.loadingStage.isLoading) return
    this.loadingStage.loading()
    try {
      const [exceptions, events] = await Promise.all([
        getEmployeeExceptions(this.employeeId),
        getEmployeeEvents(this.employeeId).catch(() => []),
      ])
      runInAction(() => {
        this.exceptions.change(exceptions)
        this.events.change(events)
        this.loadingStage.success()
      })
    } catch (error) {
      console.error('[MyExceptionsStore] fetch failed', error)
      runInAction(() => this.loadingStage.error())
    }
  }

  async create(payload: CreateScheduleExceptionPayload): Promise<boolean> {
    if (this.submitStage.isLoading) return false
    this.submitStage.loading()
    runInAction(() => {
      this.lastError = null
    })
    try {
      const exception = await createScheduleException(this.employeeId, payload)
      runInAction(() => {
        this.exceptions.change([exception, ...this.exceptions.value])
        this.submitStage.success()
      })
      return true
    } catch (error) {
      console.error('[MyExceptionsStore] create failed', error)
      const message = resolveErrorMessage(error, 'Не удалось добавить исключение')
      runInAction(() => {
        this.lastError = message
        this.submitStage.error()
      })
      return false
    }
  }

  async update(exceptionId: string, payload: UpdateScheduleExceptionPayload): Promise<boolean> {
    if (this.submitStage.isLoading) return false
    this.submitStage.loading()
    runInAction(() => {
      this.lastError = null
    })
    try {
      const updated = await updateScheduleException(this.employeeId, exceptionId, payload)
      runInAction(() => {
        this.exceptions.change(
          this.exceptions.value.map((e) => (e.id === updated.id ? updated : e))
        )
        this.submitStage.success()
      })
      return true
    } catch (error) {
      console.error('[MyExceptionsStore] update failed', error)
      const message = resolveErrorMessage(error, 'Не удалось обновить исключение')
      runInAction(() => {
        this.lastError = message
        this.submitStage.error()
      })
      return false
    }
  }

  async remove(exceptionId: string): Promise<boolean> {
    if (this.submitStage.isLoading) return false
    this.submitStage.loading()
    runInAction(() => {
      this.lastError = null
    })
    try {
      await deleteScheduleException(this.employeeId, exceptionId)
      runInAction(() => {
        this.exceptions.change(this.exceptions.value.filter((e) => e.id !== exceptionId))
        this.submitStage.success()
      })
      return true
    } catch (error) {
      console.error('[MyExceptionsStore] remove failed', error)
      const message = resolveErrorMessage(error, 'Не удалось удалить исключение')
      runInAction(() => {
        this.lastError = message
        this.submitStage.error()
      })
      return false
    }
  }

  resetError(): void {
    this.lastError = null
  }
}

function resolveErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    const detail =
      typeof error.payload === 'object' && error.payload !== null
        ? (error.payload as { detail?: unknown }).detail
        : null
    if (typeof detail === 'string') return detail
  }
  return error instanceof Error ? error.message : fallback
}
