import { API_URLS } from '@/shared/api/apiUrls'
import { apiClient } from '@/shared/api/client'

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
