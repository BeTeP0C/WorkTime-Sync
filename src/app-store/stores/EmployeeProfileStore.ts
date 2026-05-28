import { makeAutoObservable, runInAction } from 'mobx'

import {
  createManualEvent,
  CreateManualEventPayload,
  getEmployeeEvents,
} from '@/entities/activity-event/api'
import { ActivityEvent } from '@/entities/activity-event/model/types'
import { explainEmployee } from '@/entities/ai/api'
import { AiEmployeeExplanation } from '@/entities/ai/model/types'
import { getEmployeeHistory } from '@/entities/change-history/api'
import { ChangeHistoryEntry } from '@/entities/change-history/model/types'
import {
  confirmEmployeeSchedule,
  createConfirmationRequest,
  declineConfirmationRequest,
  getConfirmationRequests,
} from '@/entities/confirmation/api'
import { ScheduleConfirmationRequest } from '@/entities/confirmation/model/types'
import { getEmployee, updateEmployee, UpdateEmployeePayload } from '@/entities/employee/api'
import { normalizeEmployee } from '@/entities/employee/lib/normalize'
import { Employee, EmployeeRaw } from '@/entities/employee/model/types'
import {
  createScheduleException,
  CreateScheduleExceptionPayload,
  getEmployeeExceptions,
  normalizeException,
} from '@/entities/exception/api'
import { ScheduleException, ScheduleExceptionRaw } from '@/entities/exception/model/types'
import { getEmployeeRecommendations, normalizeRecommendation } from '@/entities/recommendation/api'
import { Recommendation, RecommendationRaw } from '@/entities/recommendation/model/types'
import {
  createWorkSchedule,
  CreateWorkSchedulePayload,
  getEmployeeActiveSchedule,
  normalizeSchedule,
} from '@/entities/schedule/api'
import { WorkSchedule, WorkScheduleRaw } from '@/entities/schedule/model/types'
import { ApiError } from '@/shared/api/client'
import { LoadingStageModel, ValueModel } from '@/shared/model'

export interface EmployeeProfileInitialData {
  employee: EmployeeRaw
  schedule: WorkScheduleRaw | null
  exceptions: ScheduleExceptionRaw[]
  recommendations: RecommendationRaw[]
}

export class EmployeeProfileStore {
  employeeId: string
  employee = new ValueModel<Employee | null>(null)
  schedule = new ValueModel<WorkSchedule | null>(null)
  exceptions = new ValueModel<ScheduleException[]>([])
  recommendations = new ValueModel<Recommendation[]>([])
  confirmationRequests = new ValueModel<ScheduleConfirmationRequest[]>([])
  events = new ValueModel<ActivityEvent[]>([])
  explanation = new ValueModel<AiEmployeeExplanation | null>(null)
  history = new ValueModel<ChangeHistoryEntry[]>([])
  loadingStage = new LoadingStageModel()
  confirmStage = new LoadingStageModel()
  editStage = new LoadingStageModel()
  updateStage = new LoadingStageModel()
  historyStage = new LoadingStageModel()
  createEventStage = new LoadingStageModel()
  explainStage = new LoadingStageModel()
  lastEditError: string | null = null
  lastUpdateError: string | null = null
  lastEventError: string | null = null
  lastExplainError: string | null = null

  constructor(employeeId: string, initial?: EmployeeProfileInitialData) {
    this.employeeId = employeeId
    makeAutoObservable(this)
    if (initial) this.hydrate(initial)
  }

  get pendingConfirmationRequest(): ScheduleConfirmationRequest | null {
    return this.confirmationRequests.value.find((r) => r.status === 'pending') ?? null
  }

  /** Заполнить стор данными, полученными на сервере (SSR/ISR). Идемпотентно. */
  hydrate(initial: EmployeeProfileInitialData): void {
    if (this.loadingStage.isSuccessful) return
    runInAction(() => {
      this.employee.change(normalizeEmployee(initial.employee))
      this.schedule.change(initial.schedule ? normalizeSchedule(initial.schedule) : null)
      this.exceptions.change(initial.exceptions.map(normalizeException))
      this.recommendations.change(initial.recommendations.map(normalizeRecommendation))
      this.loadingStage.success()
    })
  }

  async fetch(): Promise<void> {
    if (this.loadingStage.isLoading) return
    this.loadingStage.loading()
    try {
      const [
        employee,
        schedule,
        exceptions,
        recommendations,
        confirmationRequests,
        events,
        history,
      ] = await Promise.all([
        getEmployee(this.employeeId),
        getEmployeeActiveSchedule(this.employeeId).catch(() => null),
        getEmployeeExceptions(this.employeeId).catch(() => []),
        getEmployeeRecommendations(this.employeeId).catch(() => []),
        getConfirmationRequests(this.employeeId).catch(() => []),
        getEmployeeEvents(this.employeeId).catch(() => []),
        getEmployeeHistory(this.employeeId, { limit: 10 }).catch(() => []),
      ])
      runInAction(() => {
        this.employee.change(employee)
        this.schedule.change(schedule)
        this.exceptions.change(exceptions)
        this.recommendations.change(recommendations)
        this.confirmationRequests.change(confirmationRequests)
        this.events.change(events)
        this.history.change(history)
        this.loadingStage.success()
      })
    } catch (error) {
      console.error('[EmployeeProfileStore] fetch failed', error)
      runInAction(() => this.loadingStage.error())
    }
  }

  async fetchHistory(limit = 10): Promise<void> {
    if (this.historyStage.isLoading) return
    this.historyStage.loading()
    try {
      const history = await getEmployeeHistory(this.employeeId, { limit })
      runInAction(() => {
        this.history.change(history)
        this.historyStage.success()
      })
    } catch (error) {
      console.error('[EmployeeProfileStore] fetchHistory failed', error)
      runInAction(() => this.historyStage.error())
    }
  }

  async updateProfile(payload: UpdateEmployeePayload): Promise<boolean> {
    if (this.updateStage.isLoading) return false
    this.updateStage.loading()
    runInAction(() => {
      this.lastUpdateError = null
    })
    try {
      const employee = await updateEmployee(this.employeeId, payload)
      runInAction(() => {
        this.employee.change(employee)
        this.updateStage.success()
      })
      void this.fetchHistory(10)
      return true
    } catch (error) {
      console.error('[EmployeeProfileStore] updateProfile failed', error)
      const message = resolveUpdateErrorMessage(error)
      runInAction(() => {
        this.lastUpdateError = message
        this.updateStage.error()
      })
      return false
    }
  }

  async createEvent(payload: Omit<CreateManualEventPayload, 'employeeId'>): Promise<boolean> {
    if (this.createEventStage.isLoading) return false
    this.createEventStage.loading()
    runInAction(() => {
      this.lastEventError = null
    })
    try {
      const event = await createManualEvent({ ...payload, employeeId: this.employeeId })
      runInAction(() => {
        this.events.change([event, ...this.events.value])
        this.createEventStage.success()
      })
      return true
    } catch (error) {
      console.error('[EmployeeProfileStore] createEvent failed', error)
      const message = error instanceof Error ? error.message : 'Не удалось создать событие'
      runInAction(() => {
        this.lastEventError = message
        this.createEventStage.error()
      })
      return false
    }
  }

  async confirmSchedule(): Promise<void> {
    if (this.confirmStage.isLoading) return
    this.confirmStage.loading()
    try {
      const result = await confirmEmployeeSchedule(this.employeeId)
      runInAction(() => {
        const current = this.schedule.value
        if (current) {
          this.schedule.change({ ...current, confirmedAt: result.confirmedAt })
        }
        const closed = new Set(result.closedRequestIds)
        this.confirmationRequests.change(
          this.confirmationRequests.value.map((r) =>
            closed.has(r.id) ? { ...r, status: 'confirmed', respondedAt: result.confirmedAt } : r
          )
        )
        this.confirmStage.success()
      })
      await this.refetchEmployee()
    } catch (error) {
      console.error('[EmployeeProfileStore] confirmSchedule failed', error)
      runInAction(() => this.confirmStage.error())
    }
  }

  async requestConfirmation(reason: string | null): Promise<void> {
    try {
      const request = await createConfirmationRequest(this.employeeId, reason)
      runInAction(() => {
        this.confirmationRequests.change([request, ...this.confirmationRequests.value])
      })
    } catch (error) {
      console.error('[EmployeeProfileStore] requestConfirmation failed', error)
    }
  }

  async declineConfirmation(requestId: string, note: string | null): Promise<void> {
    try {
      const updated = await declineConfirmationRequest(this.employeeId, requestId, note)
      runInAction(() => {
        this.confirmationRequests.change(
          this.confirmationRequests.value.map((r) => (r.id === updated.id ? updated : r))
        )
      })
    } catch (error) {
      console.error('[EmployeeProfileStore] declineConfirmation failed', error)
    }
  }

  private async refetchEmployee(): Promise<void> {
    try {
      const employee = await getEmployee(this.employeeId)
      runInAction(() => this.employee.change(employee))
    } catch (error) {
      console.error('[EmployeeProfileStore] refetchEmployee failed', error)
    }
  }

  async createSchedule(payload: CreateWorkSchedulePayload): Promise<boolean> {
    if (this.editStage.isLoading) return false
    this.editStage.loading()
    runInAction(() => {
      this.lastEditError = null
    })
    try {
      const schedule = await createWorkSchedule(this.employeeId, payload)
      runInAction(() => {
        this.schedule.change(schedule)
        this.editStage.success()
      })
      void this.refetchEmployee()
      return true
    } catch (error) {
      console.error('[EmployeeProfileStore] createSchedule failed', error)
      const message = error instanceof Error ? error.message : 'Не удалось сохранить график'
      runInAction(() => {
        this.lastEditError = message
        this.editStage.error()
      })
      return false
    }
  }

  async createException(payload: CreateScheduleExceptionPayload): Promise<boolean> {
    if (this.editStage.isLoading) return false
    this.editStage.loading()
    runInAction(() => {
      this.lastEditError = null
    })
    try {
      const exception = await createScheduleException(this.employeeId, payload)
      runInAction(() => {
        this.exceptions.change([exception, ...this.exceptions.value])
        this.editStage.success()
      })
      return true
    } catch (error) {
      console.error('[EmployeeProfileStore] createException failed', error)
      const message = error instanceof Error ? error.message : 'Не удалось добавить исключение'
      runInAction(() => {
        this.lastEditError = message
        this.editStage.error()
      })
      return false
    }
  }

  async explain(): Promise<void> {
    if (this.explainStage.isLoading) return
    this.explainStage.loading()
    runInAction(() => {
      this.lastExplainError = null
    })
    try {
      const explanation = await explainEmployee(this.employeeId, true)
      runInAction(() => {
        this.explanation.change(explanation)
        this.explainStage.success()
      })
    } catch (error) {
      console.error('[EmployeeProfileStore] explain failed', error)
      const message = resolveExplainErrorMessage(error)
      runInAction(() => {
        this.lastExplainError = message
        this.explainStage.error()
      })
    }
  }
}

function resolveUpdateErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const detail =
      typeof error.payload === 'object' && error.payload !== null
        ? (error.payload as { detail?: unknown }).detail
        : null
    if (typeof detail === 'string') return detail
  }
  return error instanceof Error ? error.message : 'Не удалось сохранить изменения'
}

function resolveExplainErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    const detail =
      typeof error.payload === 'object' && error.payload !== null
        ? (error.payload as { detail?: unknown }).detail
        : null
    if (
      error.status === 503 ||
      (typeof detail === 'string' && detail.includes('OPENROUTER_API_KEY'))
    ) {
      return 'AI не настроен на сервере. Добавьте OPENROUTER_API_KEY в backend .env.'
    }
    if (typeof detail === 'string') return detail
  }
  return error instanceof Error ? error.message : 'Не удалось получить AI-объяснение'
}
