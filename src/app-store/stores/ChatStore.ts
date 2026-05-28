import { makeAutoObservable, runInAction } from 'mobx'

import { extractStreamingAnswer, isAiNotConfiguredError, streamAi } from '@/entities/ai/api'
import { ChatMessage } from '@/entities/ai/model/types'
import { safeGetRaw, safeRemove, safeSet } from '@/shared/lib/localStorage'
import { LoadingStageModel, ValueModel } from '@/shared/model'

const AI_NOT_CONFIGURED_MESSAGE =
  'AI не настроен на сервере. Добавьте OPENROUTER_API_KEY в backend .env.'

const STORAGE_PREFIX = 'chat.messages.v1'
const STORAGE_SCOPE_GUEST = 'guest'
/** Сколько последних сообщений держим в localStorage — чтобы не раздувать квоту. */
const MAX_PERSISTED_MESSAGES = 100

function storageKey(scopeId: string | null): string {
  return `${STORAGE_PREFIX}.${scopeId ?? STORAGE_SCOPE_GUEST}`
}

function createId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function loadPersisted(scopeId: string | null): ChatMessage[] {
  const raw = safeGetRaw(storageKey(scopeId))
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(isValidPersistedMessage)
  } catch {
    return []
  }
}

function isValidPersistedMessage(m: unknown): m is ChatMessage {
  if (!m || typeof m !== 'object') return false
  const cast = m as Partial<ChatMessage>
  return (
    typeof cast.id === 'string' &&
    typeof cast.createdAt === 'string' &&
    (cast.role === 'user' || cast.role === 'assistant' || cast.role === 'error')
  )
}

export class ChatStore {
  messages = new ValueModel<ChatMessage[]>([])
  input = new ValueModel<string>('')
  targetEmployeeId = new ValueModel<string | null>(null)
  targetTeamId = new ValueModel<string | null>(null)
  askStage = new LoadingStageModel()
  lastError: string | null = null

  /** id текущего пользователя — нужно для скоупа localStorage-ключа. Можно сменить
   *  на лету через {@link setScope}; при смене история перезагружается из storage. */
  private scopeId: string | null = null
  /** Контроллер для отмены текущего streaming-запроса (если идёт). */
  private currentStream: { cancel: () => void } | null = null
  /** Сырой буфер JSON, который собирается из стрим-чанков для текущего ответа. */
  private streamBuffer = ''
  /** id placeholder-сообщения, в которое наматывается streaming-ответ. */
  private streamingMessageId: string | null = null

  constructor(scopeId: string | null = null) {
    makeAutoObservable<this, 'currentStream' | 'streamBuffer' | 'streamingMessageId' | 'scopeId'>(
      this,
      {
        currentStream: false,
        streamBuffer: false,
        streamingMessageId: false,
        scopeId: false,
      }
    )
    this.scopeId = scopeId
    this.messages.change(loadPersisted(scopeId))
  }

  /** Сменить скоуп (после login/logout) — подгружает соответствующую историю. */
  setScope(scopeId: string | null): void {
    if (this.scopeId === scopeId) return
    this.cancelStreaming()
    this.scopeId = scopeId
    runInAction(() => {
      this.messages.change(loadPersisted(scopeId))
      this.lastError = null
      this.askStage.reset()
    })
  }

  setTargetEmployee(employeeId: string | null): void {
    this.targetEmployeeId.change(employeeId)
  }

  setTargetTeam(teamId: string | null): void {
    this.targetTeamId.change(teamId)
  }

  reset(): void {
    this.cancelStreaming()
    runInAction(() => {
      this.messages.change([])
      this.input.change('')
      this.lastError = null
      this.askStage.reset()
    })
    safeRemove(storageKey(this.scopeId))
  }

  /** Прервать текущий стрим (если идёт). Не очищает уже накопленный текст. */
  cancelStreaming(): void {
    if (this.currentStream) {
      this.currentStream.cancel()
      this.currentStream = null
    }
    this.streamBuffer = ''
    this.streamingMessageId = null
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
    const placeholderId = createId()
    const placeholder: ChatMessage = {
      id: placeholderId,
      role: 'assistant',
      streamingText: '',
      createdAt: new Date().toISOString(),
    }

    runInAction(() => {
      this.messages.change([...this.messages.value, userMessage, placeholder])
      this.input.change('')
      this.lastError = null
      this.askStage.loading()
    })
    this.persist()

    this.streamBuffer = ''
    this.streamingMessageId = placeholderId

    await new Promise<void>((resolve) => {
      this.currentStream = streamAi(
        {
          question,
          employeeId: this.targetEmployeeId.value,
          teamId: this.targetTeamId.value,
          useRag: true,
        },
        {
          onDelta: (chunk) => {
            this.streamBuffer += chunk
            const progress = extractStreamingAnswer(this.streamBuffer)
            if (progress !== null) this.updateStreamingPlaceholder({ streamingText: progress })
          },
          onDone: (response) => {
            runInAction(() => {
              this.replaceMessage(placeholderId, {
                id: placeholderId,
                role: 'assistant',
                payload: response,
                createdAt: placeholder.createdAt,
              })
              this.askStage.success()
            })
            this.persist()
            this.currentStream = null
            this.streamBuffer = ''
            this.streamingMessageId = null
            resolve()
          },
          onError: (detail, status) => {
            const text =
              status === 503 || isAiNotConfiguredError(detail)
                ? AI_NOT_CONFIGURED_MESSAGE
                : detail || 'Не удалось получить ответ AI.'
            runInAction(() => {
              this.replaceMessage(placeholderId, {
                id: placeholderId,
                role: 'error',
                text,
                createdAt: placeholder.createdAt,
              })
              this.lastError = text
              this.askStage.error()
            })
            this.persist()
            this.currentStream = null
            this.streamBuffer = ''
            this.streamingMessageId = null
            resolve()
          },
        }
      )
    })
  }

  // ────────────────────────────────────────────────────────────────────────
  //  private helpers
  // ────────────────────────────────────────────────────────────────────────

  private updateStreamingPlaceholder(patch: Partial<ChatMessage>): void {
    if (!this.streamingMessageId) return
    const id = this.streamingMessageId
    runInAction(() => {
      this.messages.change(this.messages.value.map((m) => (m.id === id ? { ...m, ...patch } : m)))
    })
  }

  private replaceMessage(id: string, next: ChatMessage): void {
    this.messages.change(this.messages.value.map((m) => (m.id === id ? next : m)))
  }

  private persist(): void {
    const persistable = this.messages.value
      .filter((m) => m.role !== 'assistant' || m.payload !== undefined)
      .slice(-MAX_PERSISTED_MESSAGES)
    if (persistable.length === 0) {
      safeRemove(storageKey(this.scopeId))
      return
    }
    safeSet(storageKey(this.scopeId), persistable)
  }
}

export const __TEST_ONLY = { storageKey, loadPersisted }
