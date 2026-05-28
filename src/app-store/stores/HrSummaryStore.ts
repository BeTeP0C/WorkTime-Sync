import { makeAutoObservable, runInAction } from 'mobx'

import { askAi } from '@/entities/ai/api'
import { AiChatResponse } from '@/entities/ai/model/types'
import { ApiError } from '@/shared/api/client'
import { LoadingStageModel, ValueModel } from '@/shared/model'

const HR_SUMMARY_QUESTION =
  'Дай краткое HR-summary по команде: сколько сотрудников требуют внимания, ' +
  'что в приоритете обновить, какие риски ближе всего к критическому порогу. ' +
  'Ответь кратко: 2–3 предложения и 1–3 рекомендации (recommendedActions).'

export class HrSummaryStore {
  summary = new ValueModel<AiChatResponse | null>(null)
  loadStage = new LoadingStageModel()
  lastError: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  async fetch(): Promise<void> {
    if (this.loadStage.isLoading) return
    runInAction(() => {
      this.lastError = null
      this.loadStage.loading()
    })
    try {
      const response = await askAi({
        question: HR_SUMMARY_QUESTION,
        useRag: true,
      })
      runInAction(() => {
        this.summary.change(response)
        this.loadStage.success()
      })
    } catch (error) {
      runInAction(() => {
        this.lastError =
          error instanceof ApiError && error.status === 503
            ? 'AI не настроен на сервере.'
            : error instanceof Error
              ? error.message
              : 'Не удалось получить HR-summary.'
        this.loadStage.error()
      })
    }
  }
}
