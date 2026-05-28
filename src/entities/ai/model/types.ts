export type AiPriority = 'low' | 'medium' | 'high' | 'critical'

export interface AiReasonRaw {
  text: string
  source_type: string | null
  source_id: string | null
}

export interface AiReason {
  text: string
  sourceType: string | null
  sourceId: string | null
}

export interface AiRecommendedActionRaw {
  priority: AiPriority
  action: string
  reason: string
}

export interface AiRecommendedAction {
  priority: AiPriority
  action: string
  reason: string
}

export interface AiChatResponseRaw {
  summary: string
  answer: string
  reasons: AiReasonRaw[]
  recommended_actions: AiRecommendedActionRaw[]
  missing_data: string[]
  used_context: string[]
}

export interface AiChatResponse {
  summary: string
  answer: string
  reasons: AiReason[]
  recommendedActions: AiRecommendedAction[]
  missingData: string[]
  usedContext: string[]
}

export interface AiEmployeeExplanationRaw extends AiChatResponseRaw {
  risk_level: string | null
}

export interface AiEmployeeExplanation extends AiChatResponse {
  riskLevel: string | null
}

export type ChatMessageRole = 'user' | 'assistant' | 'error'

export interface ChatMessage {
  id: string
  role: ChatMessageRole
  text?: string
  payload?: AiChatResponse
  /** Частично пришедший `answer` ассистента во время стрима. Когда `payload`
   *  не пустой — сообщение завершено и `streaming*` поля больше не нужны. */
  streamingText?: string
  /** Частично пришедший `summary` ассистента во время стрима. */
  streamingSummary?: string
  createdAt: string
}

export const PRIORITY_LABEL_RU: Record<AiPriority, string> = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий',
  critical: 'Критический',
}
