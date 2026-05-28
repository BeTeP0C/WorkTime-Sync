import {
  AiPriority,
  AiReason,
  AiRecommendedAction,
  PRIORITY_LABEL_RU,
} from '@/entities/ai/model/types'
import { Badge, BadgeTone } from '@/shared/ui/Badge'

import s from './AiResponseView.module.scss'

interface AiResponseViewProps {
  summary?: string
  answer?: string
  reasons: AiReason[]
  recommendedActions: AiRecommendedAction[]
  missingData?: string[]
  usedContext?: string[]
  riskLevel?: string | null
}

const PRIORITY_TONE: Record<AiPriority, BadgeTone> = {
  low: 'neutral',
  medium: 'medium',
  high: 'high',
  critical: 'critical',
}

const SOURCE_TYPE_LABEL_RU: Record<string, string> = {
  employee_metrics: 'Метрики',
  activity_events: 'Календарь',
  work_schedules: 'График',
  rag_chunk: 'База знаний',
}

export function AiResponseView({
  summary,
  answer,
  reasons,
  recommendedActions,
  missingData,
  usedContext,
  riskLevel,
}: AiResponseViewProps) {
  return (
    <div className={s.root}>
      {(summary || riskLevel) && (
        <header className={s.header}>
          {summary && <p className={s.summary}>{summary}</p>}
          {riskLevel && (
            <Badge tone={riskLevelToTone(riskLevel)} size="sm" pill>
              Риск: {riskLevel}
            </Badge>
          )}
        </header>
      )}

      {answer && <p className={s.answer}>{answer}</p>}

      {reasons.length > 0 && (
        <section className={s.section}>
          <h4 className={s.sectionTitle}>Причины</h4>
          <ul className={s.reasonsList}>
            {reasons.map((reason, idx) => (
              <li key={idx} className={s.reasonRow}>
                <span className={s.reasonText}>{reason.text}</span>
                {reason.sourceType && (
                  <Badge tone="neutral" size="sm" pill>
                    {SOURCE_TYPE_LABEL_RU[reason.sourceType] ?? reason.sourceType}
                  </Badge>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {recommendedActions.length > 0 && (
        <section className={s.section}>
          <h4 className={s.sectionTitle}>Рекомендации</h4>
          <ul className={s.actionsList}>
            {recommendedActions.map((action, idx) => (
              <li key={idx} className={s.actionRow}>
                <div className={s.actionHead}>
                  <Badge tone={PRIORITY_TONE[action.priority]} size="sm" pill>
                    {PRIORITY_LABEL_RU[action.priority]}
                  </Badge>
                  <span className={s.actionText}>{action.action}</span>
                </div>
                <div className={s.actionReason}>{action.reason}</div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {missingData && missingData.length > 0 && (
        <section className={s.section}>
          <h4 className={s.sectionTitle}>Чего не хватает</h4>
          <ul className={s.bulletsList}>
            {missingData.map((item, idx) => (
              <li key={idx} className={s.bullet}>
                {item}
              </li>
            ))}
          </ul>
        </section>
      )}

      {usedContext && usedContext.length > 0 && (
        <div className={s.chipsRow}>
          {usedContext.map((tag) => (
            <span key={tag} className={s.chip}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function riskLevelToTone(level: string): BadgeTone {
  switch (level) {
    case 'critical':
      return 'critical'
    case 'high':
      return 'high'
    case 'medium':
      return 'medium'
    case 'low':
      return 'low'
    default:
      return 'neutral'
  }
}
