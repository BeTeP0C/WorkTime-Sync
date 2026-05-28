import { makeAutoObservable, runInAction } from 'mobx'

import { explainEmployee } from '@/entities/ai/api'
import { AiEmployeeExplanation } from '@/entities/ai/model/types'
import { ApiError } from '@/shared/api/client'
import { LoadingStageModel, ValueModel } from '@/shared/model'

function resolveErrorMessage(error: unknown): string {
  if (error instanceof ApiError && error.status === 503) {
    return 'AI не настроен на сервере.'
  }
  if (error instanceof Error) return error.message
  return 'Не удалось получить объяснение AI.'
}

/**
 * Тонкий стор для одного сотрудника. Дублирует EmployeeProfileStore.explain(),
 * но без зависимости от большого профильного стора — чтобы виджет
 * AiRiBreakdownCard можно было встроить на разные страницы (Recommendations,
 * EmployeeProfile, ...) без побочных эффектов.
 */
export class EmployeeExplanationStore {
  explanation = new ValueModel<AiEmployeeExplanation | null>(null)
  loadStage = new LoadingStageModel()
  lastError: string | null = null

  constructor(public readonly employeeId: string) {
    makeAutoObservable(this)
  }

  async fetch(): Promise<void> {
    if (this.loadStage.isLoading) return
    runInAction(() => {
      this.lastError = null
      this.loadStage.loading()
    })
    try {
      const response = await explainEmployee(this.employeeId, true)
      runInAction(() => {
        this.explanation.change(response)
        this.loadStage.success()
      })
    } catch (error) {
      runInAction(() => {
        this.lastError = resolveErrorMessage(error)
        this.loadStage.error()
      })
    }
  }
}
