'use client'

import { useEffect, useState } from 'react'

import { askAi } from '@/entities/ai/api'
import { AiChatResponse } from '@/entities/ai/model/types'
import { ApiError } from '@/shared/api/client'
import { Card, CardHeader } from '@/shared/ui/Card'

import s from './AiDailyTip.module.scss'

interface AiDailyTipProps {
  employeeId: string
}

interface CachedTip {
  date: string
  summary: string
  answer: string
  firstActionText?: string
  firstActionReason?: string
}

const TIP_QUESTION =
  'Один короткий персональный совет на сегодня по моему расписанию, нагрузке ' +
  'и предстоящим встречам. 1–2 предложения, конкретное действие.'

function cacheKey(employeeId: string): string {
  return `ai-daily-tip:${employeeId}`
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

function readCache(employeeId: string): CachedTip | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(cacheKey(employeeId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as CachedTip
    if (parsed.date !== todayKey()) return null
    return parsed
  } catch {
    return null
  }
}

function writeCache(employeeId: string, tip: CachedTip): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(cacheKey(employeeId), JSON.stringify(tip))
  } catch {
    // ignore quota errors
  }
}

function toCached(response: AiChatResponse): CachedTip {
  const firstAction = response.recommendedActions[0]
  return {
    date: todayKey(),
    summary: response.summary,
    answer: response.answer,
    firstActionText: firstAction?.action,
    firstActionReason: firstAction?.reason,
  }
}

export function AiDailyTip({ employeeId }: AiDailyTipProps) {
  const [tip, setTip] = useState<CachedTip | null>(null)
  const [isLoading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const cached = readCache(employeeId)
    if (cached) {
      setTip(cached)
      return
    }
    let aborted = false
    setLoading(true)
    setError(null)
    askAi({ question: TIP_QUESTION, employeeId, useRag: true })
      .then((response) => {
        if (aborted) return
        const next = toCached(response)
        writeCache(employeeId, next)
        setTip(next)
      })
      .catch((err: unknown) => {
        if (aborted) return
        if (err instanceof ApiError && err.status === 503) {
          setError('AI не настроен на сервере.')
        } else if (err instanceof Error) {
          setError(err.message)
        } else {
          setError('Не удалось получить совет дня.')
        }
      })
      .finally(() => {
        if (!aborted) setLoading(false)
      })
    return () => {
      aborted = true
    }
  }, [employeeId])

  return (
    <Card padding="lg" className={s.card}>
      <CardHeader
        title={
          <span className={s.head}>
            <span className={s.icon}>💡</span>
            <span className={s.title}>Совет дня</span>
          </span>
        }
      />
      {error && <div className={s.error}>{error}</div>}
      {!error && isLoading && !tip && <div className={s.empty}>AI готовит совет…</div>}
      {tip && (
        <div className={s.body}>
          {tip.summary && <div>{tip.summary}</div>}
          {tip.answer && tip.answer !== tip.summary && (
            <div style={{ marginTop: 4 }}>{tip.answer}</div>
          )}
          {tip.firstActionText && (
            <div className={s.action}>
              <div className={s.actionTitle}>{tip.firstActionText}</div>
              {tip.firstActionReason && <div>{tip.firstActionReason}</div>}
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
