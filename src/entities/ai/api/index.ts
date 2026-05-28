import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient, ApiError, AUTH_TOKEN_STORAGE_KEY } from '@/shared/api/client'
import { API_BASE } from '@/shared/config/env'
import { safeGetRaw } from '@/shared/lib/localStorage'

import {
  AiChatResponse,
  AiChatResponseRaw,
  AiEmployeeExplanation,
  AiEmployeeExplanationRaw,
  AiReason,
  AiReasonRaw,
} from '../model/types'

function normalizeReason(raw: AiReasonRaw): AiReason {
  return {
    text: raw.text,
    sourceType: raw.source_type,
    sourceId: raw.source_id,
  }
}

export function normalizeAiChatResponse(raw: AiChatResponseRaw): AiChatResponse {
  return {
    summary: raw.summary,
    answer: raw.answer,
    reasons: raw.reasons.map(normalizeReason),
    recommendedActions: raw.recommended_actions,
    missingData: raw.missing_data,
    usedContext: raw.used_context,
  }
}

export function normalizeAiExplanation(raw: AiEmployeeExplanationRaw): AiEmployeeExplanation {
  return {
    ...normalizeAiChatResponse(raw),
    riskLevel: raw.risk_level,
  }
}

export interface AskAiPayload {
  question: string
  employeeId?: string | null
  teamId?: string | null
  useRag?: boolean
}

export async function askAi(payload: AskAiPayload): Promise<AiChatResponse> {
  const body: Record<string, unknown> = {
    question: payload.question,
    use_rag: payload.useRag ?? true,
  }
  if (payload.employeeId) body.employee_id = payload.employeeId
  if (payload.teamId) body.team_id = payload.teamId
  const data = await apiClient<AiChatResponseRaw>('POST', API_URLS.aiChat(), { body })
  return normalizeAiChatResponse(data)
}

export async function explainEmployee(
  employeeId: string,
  useRag: boolean = true
): Promise<AiEmployeeExplanation> {
  const data = await apiClient<AiEmployeeExplanationRaw>(
    'POST',
    API_URLS.aiExplainEmployee(employeeId),
    { body: { use_rag: useRag } }
  )
  return normalizeAiExplanation(data)
}

// ────────────────────────────────────────────────────────────────────────────
//  Streaming chat (SSE)
// ────────────────────────────────────────────────────────────────────────────

function readAuthToken(): string | null {
  const raw = safeGetRaw(AUTH_TOKEN_STORAGE_KEY)
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    return typeof parsed === 'string' ? parsed : null
  } catch {
    return raw
  }
}

export interface StreamAiCallbacks {
  /** Каждый текстовый чанк от LLM (как пришёл). */
  onDelta: (chunk: string) => void
  /** Структурированный финальный ответ. */
  onDone: (response: AiChatResponse) => void
  /** Терминальная ошибка стрима. */
  onError: (message: string, status?: number) => void
}

/**
 * Стримит ответ AI через SSE. Не ходит через apiClient, потому что нужен
 * native fetch + ReadableStream (apiClient полностью буферизует ответ).
 * Возвращает функцию отмены — аккуратно прерывает стрим через AbortController.
 */
export function streamAi(
  payload: AskAiPayload,
  callbacks: StreamAiCallbacks
): { cancel: () => void } {
  const controller = new AbortController()
  void runStream(payload, callbacks, controller.signal)
  return { cancel: () => controller.abort() }
}

async function runStream(
  payload: AskAiPayload,
  cb: StreamAiCallbacks,
  signal: AbortSignal
): Promise<void> {
  const token = readAuthToken()
  let response: Response
  try {
    response = await fetch(`${API_BASE}${API_URLS.aiChatStream()}`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        question: payload.question,
        use_rag: payload.useRag ?? true,
        ...(payload.employeeId ? { employee_id: payload.employeeId } : {}),
        ...(payload.teamId ? { team_id: payload.teamId } : {}),
      }),
      signal,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    cb.onError('Нет соединения с сервером')
    return
  }

  if (!response.ok) {
    let detail = `Request failed: ${response.status}`
    try {
      const body = (await response.json()) as { detail?: string }
      if (typeof body?.detail === 'string') detail = body.detail
    } catch {
      // ignore — оставляем общий текст
    }
    cb.onError(detail, response.status)
    return
  }

  const body = response.body
  if (!body) {
    cb.onError('Браузер не поддерживает стриминг ответа AI')
    return
  }

  const reader = body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      // SSE-сообщения разделены двойным переводом строки.
      let separatorIndex: number
      while ((separatorIndex = buffer.indexOf('\n\n')) !== -1) {
        const rawEvent = buffer.slice(0, separatorIndex)
        buffer = buffer.slice(separatorIndex + 2)
        handleSseEvent(rawEvent, cb)
      }
    }
    if (buffer.trim().length > 0) handleSseEvent(buffer, cb)
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return
    cb.onError('Стрим оборвался')
  }
}

function handleSseEvent(rawEvent: string, cb: StreamAiCallbacks): void {
  let event = 'message'
  const dataLines: string[] = []
  for (const line of rawEvent.split('\n')) {
    if (line.startsWith('event:')) {
      event = line.slice(6).trim()
    } else if (line.startsWith('data:')) {
      dataLines.push(line.slice(5).trim())
    }
  }
  if (dataLines.length === 0) return
  const data = dataLines.join('\n')
  let parsed: unknown
  try {
    parsed = JSON.parse(data)
  } catch {
    return
  }
  if (event === 'delta') {
    const text = (parsed as { text?: unknown })?.text
    if (typeof text === 'string') cb.onDelta(text)
  } else if (event === 'done') {
    const responseRaw = (parsed as { response?: AiChatResponseRaw })?.response
    if (responseRaw) cb.onDone(normalizeAiChatResponse(responseRaw))
  } else if (event === 'error') {
    const detail = (parsed as { detail?: unknown })?.detail
    cb.onError(typeof detail === 'string' ? detail : 'Ошибка AI')
  }
}

export interface StreamingProgress {
  summary: string | null
  answer: string | null
}

/**
 * Извлекает текущие значения полей `summary` и `answer` из накопленного буфера
 * частично-валидного JSON (для typewriter-эффекта во время стрима). Каждое поле —
 * `null`, если оно ещё не начало приходить.
 *
 * Прикинутый ответ LLM выглядит так:
 * `{"summary":"...","answer":"...","reasons":[...]}` — `summary` приходит
 * первым и часто полностью пуст в первые 1-2 секунды стрима, поэтому пузырь
 * долго был пустой. Теперь сразу показываем то, что есть.
 */
export function extractStreamingProgress(buffer: string): StreamingProgress {
  return {
    summary: extractJsonStringField(buffer, 'summary'),
    answer: extractJsonStringField(buffer, 'answer'),
  }
}

function extractJsonStringField(buffer: string, field: string): string | null {
  const re = new RegExp(`"${field}"\\s*:\\s*"((?:[^"\\\\]|\\\\.)*)`)
  const match = buffer.match(re)
  if (!match) return null
  const raw = match[1]
  const safe = raw.endsWith('\\') ? raw.slice(0, -1) : raw
  try {
    return JSON.parse(`"${safe}"`) as string
  } catch {
    return safe
  }
}

/** @deprecated используйте {@link extractStreamingProgress}. Оставлено для обратной совместимости. */
export function extractStreamingAnswer(buffer: string): string | null {
  return extractJsonStringField(buffer, 'answer')
}

/** Гарантия, что причина — отказ AI из-за отсутствия ключа OpenRouter. */
export function isAiNotConfiguredError(error: unknown): boolean {
  if (error instanceof ApiError) {
    if (error.status === 503) return true
    const detail =
      typeof error.payload === 'object' && error.payload !== null
        ? (error.payload as { detail?: unknown }).detail
        : null
    return typeof detail === 'string' && detail.includes('OPENROUTER_API_KEY')
  }
  if (typeof error === 'string') return error.includes('OPENROUTER_API_KEY')
  return false
}
