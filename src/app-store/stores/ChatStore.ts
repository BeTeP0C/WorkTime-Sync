import { makeAutoObservable, runInAction } from 'mobx'

import { askAi } from '@/entities/ai/api'
import { AiChatResponse, ChatMessage } from '@/entities/ai/model/types'
import { ApiError } from '@/shared/api/client'
import { LoadingStageModel, ValueModel } from '@/shared/model'

const AI_NOT_CONFIGURED_MESSAGE =
  'AI не настроен на сервере. Добавьте OPENROUTER_API_KEY в backend .env.'

function isAiNotConfigured(error: unknown): boolean {
  if (error instanceof ApiError) {
    if (error.status === 503) return true
    const detail =
      typeof error.payload === 'object' && error.payload !== null
        ? (error.payload as { detail?: unknown }).detail
        : null
    return typeof detail === 'string' && detail.includes('OPENROUTER_API_KEY')
  }
  return false
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export class ChatStore {
  messages = new ValueModel<ChatMessage[]>([])
  input = new ValueModel<string>('')
  targetEmployeeId = new ValueModel<string | null>(null)
  targetTeamId = new ValueModel<string | null>(null)
  askStage = new LoadingStageModel()
  lastError: string | null = null

  constructor() {
    makeAutoObservable(this)
  }

  setTargetEmployee(employeeId: string | null): void {
    this.targetEmployeeId.change(employeeId)
  }

  setTargetTeam(teamId: string | null): void {
    this.targetTeamId.change(teamId)
  }

  reset(): void {
    runInAction(() => {
      this.messages.change([])
      this.input.change('')
      this.lastError = null
      this.askStage.reset()
    })
  }

  async send(): Promise<void> {
    const question = this.input.value.trim()
    if (!question || this.askStage.isLoading) return

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      text: question,
      createdAt: new Date().toISOString(),
    }

    runInAction(() => {
      this.messages.change([...this.messages.value, userMessage])
      this.input.change('')
      this.lastError = null
      this.askStage.loading()
    })

    try {
      const response: AiChatResponse = await askAi({
        question,
        employeeId: this.targetEmployeeId.value,
        teamId: this.targetTeamId.value,
        useRag: true,
      })
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: 'assistant',
        payload: response,
        createdAt: new Date().toISOString(),
      }
      runInAction(() => {
        this.messages.change([...this.messages.value, assistantMessage])
        this.askStage.success()
      })
    } catch (error) {
      const isNotConfigured = isAiNotConfigured(error)
      const text = isNotConfigured
        ? AI_NOT_CONFIGURED_MESSAGE
        : error instanceof Error
          ? error.message
          : 'Не удалось получить ответ AI.'
      console.error('[ChatStore] send failed', error)
      runInAction(() => {
        this.lastError = text
        this.messages.change([
          ...this.messages.value,
          {
            id: createId(),
            role: 'error',
            text,
            createdAt: new Date().toISOString(),
          },
        ])
        this.askStage.error()
      })
    }
  }
}
