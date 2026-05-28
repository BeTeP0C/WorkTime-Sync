'use client'

import { useEffect, useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'

import { EmployeeExplanationStore } from '@/app-store/stores/EmployeeExplanationStore'
import { AiEmployeeExplanation } from '@/entities/ai/model/types'
import { EmployeeMetric } from '@/entities/employee/model/types'
import { breakdownRi, forecastAiAfterUpdate, forecastRiAfterUpdate } from '@/shared/lib/riskFormula'
import { Card, CardHeader } from '@/shared/ui/Card'

import s from './AiRiBreakdownCard.module.scss'

interface AiRiBreakdownCardProps {
  employeeId: string
  metric: EmployeeMetric
  /**
   * Готовое объяснение из родительского стора. Если передано — виджет не
   * делает собственный fetch и берёт нарратив отсюда.
   */
  explanation?: AiEmployeeExplanation | null
  /** Если объяснение ещё грузится во внешнем сторе. */
  isExplanationLoading?: boolean
  /** Сообщение об ошибке из внешнего стора. */
  explanationError?: string | null
}

export const AiRiBreakdownCard = observer(function AiRiBreakdownCard({
  employeeId,
  metric,
  explanation: externalExplanation,
  isExplanationLoading: externalLoading,
  explanationError: externalError,
}: AiRiBreakdownCardProps) {
  const isExternallyControlled = externalExplanation !== undefined
  const [internalStore] = useState(() =>
    isExternallyControlled ? null : new EmployeeExplanationStore(employeeId)
  )

  const components = useMemo(() => breakdownRi(metric), [metric])
  const forecastAi = forecastAiAfterUpdate()
  const forecastRi = forecastRiAfterUpdate(metric)

  useEffect(() => {
    if (internalStore && internalStore.loadStage.isNotStarted) void internalStore.fetch()
  }, [internalStore])

  const explanation = isExternallyControlled
    ? externalExplanation
    : internalStore?.explanation.value
  const isLoading = isExternallyControlled
    ? Boolean(externalLoading)
    : Boolean(internalStore?.loadStage.isInitial)
  const error = isExternallyControlled
    ? (externalError ?? null)
    : (internalStore?.lastError ?? null)
  const firstReason = explanation?.reasons[0]

  return (
    <Card padding="lg" className={s.card}>
      <CardHeader
        title={
          <span className={s.head}>
            <span className={s.icon}>🤖</span>AI-объяснение
          </span>
        }
      />
      <p className={s.sub}>Ri = {metric.riskScore.toFixed(2)} складывается из:</p>
      <ul className={s.list}>
        {components.map((c) => (
          <li key={c.key} className={s.row}>
            <span className={s.rowLabel}>{c.label}</span>
            <span className={s.rowContribution}>+{c.contribution.toFixed(2)}</span>
            <span className={s.rowHint}>{c.hint}</span>
          </li>
        ))}
      </ul>

      <div className={s.forecast}>
        <div className={s.forecastHint}>💡 Прогноз</div>
        Если вы обновите график сегодня, ваш Ai вырастет с{' '}
        <span className={s.forecastStrong}>{metric.actualityScore.toFixed(2)}</span> до{' '}
        <span className={s.forecastAccent}>{forecastAi.toFixed(2)}</span>, а общий риск снизится с{' '}
        <span className={s.forecastStrong}>{metric.riskScore.toFixed(2)}</span> до{' '}
        <span className={s.forecastAccent}>{forecastRi.toFixed(2)}</span>.
      </div>

      {error && (
        <div className={s.narrative}>
          <span className={s.error}>{error}</span>
        </div>
      )}
      {!error && isLoading && !explanation && (
        <div className={s.narrative}>
          <span className={s.loading}>AI готовит объяснение…</span>
        </div>
      )}
      {explanation && (explanation.summary || firstReason) && (
        <div className={s.narrative}>
          {explanation.summary && <div>{explanation.summary}</div>}
          {firstReason && <div style={{ marginTop: 4 }}>{firstReason.text}</div>}
        </div>
      )}
    </Card>
  )
})
