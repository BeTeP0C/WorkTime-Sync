import { Card, CardHeader } from '@/shared/ui/Card'

import s from './RecommendationWeeklyChart.module.scss'

interface WeekBar {
  label: string
  value: number
}

// TODO(backend): GET /recommendations/stats?period=weekly — пока mock по макету
const MOCK_WEEKS: WeekBar[] = [
  { label: 'Апр 7', value: 2 },
  { label: 'Апр 14', value: 3 },
  { label: 'Апр 21', value: 5 },
  { label: 'Май 1', value: 4 },
  { label: 'Май 10', value: 6 },
  { label: 'Май 19', value: 6 },
]

export function RecommendationWeeklyChart() {
  const max = Math.max(...MOCK_WEEKS.map((w) => w.value), 1)

  return (
    <Card padding="md" className={s.card}>
      <CardHeader title="Выполнение по неделям" />
      <div className={s.chart}>
        {MOCK_WEEKS.map((week) => {
          const heightPercent = Math.round((week.value / max) * 100)
          return (
            <div key={week.label} className={s.col}>
              <div className={s.barWrap}>
                <div className={s.bar} style={{ height: `${heightPercent}%` }}>
                  <span className={s.barValue}>{week.value}</span>
                </div>
              </div>
              <span className={s.barLabel}>{week.label}</span>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
