import {
  CATEGORIES_ORDER,
  CATEGORY_LABEL_RU,
  RecommendationCategory,
} from '@/app-store/stores/RecommendationsStore'
import { Card, CardHeader } from '@/shared/ui/Card'

import s from './RecommendationTypeBreakdown.module.scss'

interface RecommendationTypeBreakdownProps {
  counts: Record<RecommendationCategory, number>
}

const CATEGORY_DOT_CLASS: Record<RecommendationCategory, string> = {
  schedule: s.dot_schedule,
  meeting: s.dot_meeting,
  load: s.dot_load,
  tz: s.dot_tz,
}

export function RecommendationTypeBreakdown({ counts }: RecommendationTypeBreakdownProps) {
  return (
    <Card padding="md" className={s.card}>
      <CardHeader title="По типам" />
      <ul className={s.list}>
        {CATEGORIES_ORDER.map((cat) => (
          <li key={cat} className={s.row}>
            <span className={`${s.dot} ${CATEGORY_DOT_CLASS[cat]}`} />
            <span className={s.label}>{CATEGORY_LABEL_RU[cat]}</span>
            <span className={s.value}>{counts[cat]}</span>
          </li>
        ))}
      </ul>
    </Card>
  )
}
