'use client'

import { useState } from 'react'
import cn from 'classnames'

import { EmployeeMetric } from '@/entities/employee/model/types'
import {
  Recommendation,
  RecommendationSeverity,
  SEVERITY_LABEL_RU,
} from '@/entities/recommendation/model/types'
import { Badge, BadgeTone } from '@/shared/ui/Badge'
import { Card, CardHeader } from '@/shared/ui/Card'
import { AiRiBreakdownCard } from '@/widgets/AiRiBreakdownCard'

import s from './MyRecommendationsList.module.scss'

const SEVERITY_TONE: Record<RecommendationSeverity, BadgeTone> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
}

interface MyRecommendationsListProps {
  employeeId: string
  metric: EmployeeMetric | null
  recommendations: Recommendation[]
}

export function MyRecommendationsList({
  employeeId,
  metric,
  recommendations,
}: MyRecommendationsListProps) {
  const items = recommendations.filter((r) => r.subjectType === 'employee')

  return (
    <Card padding="lg" className={s.card}>
      <CardHeader title="Мои рекомендации" />
      {items.length === 0 ? (
        <div className={s.empty}>Активных рекомендаций нет — данные актуальны.</div>
      ) : (
        <ul className={s.list}>
          {items.map((rec, idx) => (
            <RecommendationItem
              key={`${rec.code}-${idx}`}
              recommendation={rec}
              employeeId={employeeId}
              metric={metric}
            />
          ))}
        </ul>
      )}
    </Card>
  )
}

interface RecommendationItemProps {
  recommendation: Recommendation
  employeeId: string
  metric: EmployeeMetric | null
}

function RecommendationItem({ recommendation, employeeId, metric }: RecommendationItemProps) {
  const [open, setOpen] = useState(false)
  const canExplain = Boolean(metric)

  return (
    <li className={s.item}>
      <div className={s.itemHeader}>
        <h4 className={s.itemTitle}>{recommendation.title}</h4>
        <Badge tone={SEVERITY_TONE[recommendation.severity]} size="sm" pill>
          {SEVERITY_LABEL_RU[recommendation.severity].toLowerCase()}
        </Badge>
      </div>
      <p className={s.itemReason}>{recommendation.reason}</p>
      {canExplain && (
        <button
          type="button"
          className={cn(s.toggle, open && s.toggleOpen)}
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
        >
          <span className={s.caret}>{open ? '▾' : '▸'}</span>
          {open ? 'Скрыть объяснение' : 'Почему?'}
        </button>
      )}
      {open && metric && (
        <div className={s.body}>
          <AiRiBreakdownCard employeeId={employeeId} metric={metric} />
        </div>
      )}
    </li>
  )
}
