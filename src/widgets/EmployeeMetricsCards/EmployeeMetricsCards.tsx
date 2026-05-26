import cn from 'classnames'

import { EmployeeMetric } from '@/entities/employee/model/types'
import { Card } from '@/shared/ui/Card'
import { ProgressBar } from '@/shared/ui/ProgressBar'

import s from './EmployeeMetricsCards.module.scss'

interface EmployeeMetricsCardsProps {
  metric: EmployeeMetric
}

export function EmployeeMetricsCards({ metric }: EmployeeMetricsCardsProps) {
  const ai = metric.actualityScore
  const li = metric.loadLevel
  const ci = metric.conflictRate

  const aiTone = ai < 0.4 ? 'critical' : ai < 0.7 ? 'high' : 'success'
  const liTone = li > 1.0 ? 'critical' : li > 0.8 ? 'high' : 'success'
  const ciTone = ci > 0.35 ? 'critical' : ci > 0.15 ? 'high' : 'success'

  return (
    <div className={s.grid}>
      <Card padding="lg" className={s.card}>
        <div className={s.label}>Актуальность Ai</div>
        <div className={cn(s.value, s[`tone_${aiTone}`])}>{ai.toFixed(2)}</div>
        <div className={s.barRow}>
          <ProgressBar value={ai} tone={aiTone} size="lg" />
          <span className={s.percent}>{Math.round(ai * 100)}%</span>
        </div>
        <div className={cn(s.hint, s[`tone_${aiTone}`])}>
          {ai < 0.4 ? 'Требует обновления' : ai < 0.7 ? 'Скоро потребует обновления' : 'В норме'}
        </div>
      </Card>

      <Card padding="lg" className={s.card}>
        <div className={s.label}>Загрузка Li</div>
        <div className={cn(s.value, s[`tone_${liTone}`])}>{li.toFixed(2)}</div>
        <div className={s.barRow}>
          <ProgressBar value={Math.min(li, 1.2)} max={1.2} tone={liTone} size="lg" />
          <span className={s.percent}>{Math.round(li * 100)}%</span>
        </div>
        <div className={cn(s.hint, s[`tone_${liTone}`])}>
          {li > 1.0
            ? 'Перегружен (порог 100%)'
            : li > 0.8
              ? 'Перегружен (порог 80%)'
              : 'В пределах нормы'}
        </div>
      </Card>

      <Card padding="lg" className={s.card}>
        <div className={s.label}>Конфликты Ci</div>
        <div className={cn(s.value, s[`tone_${ciTone}`])}>{Math.round(ci * 100)}%</div>
        <div className={s.barRow}>
          <ProgressBar value={ci} tone={ciTone} size="lg" />
          <span className={s.percent}>{Math.round(ci * 100)}%</span>
        </div>
        <div className={cn(s.hint, s[`tone_${ciTone}`])}>
          {ci > 0.35
            ? 'Много встреч вне графика'
            : ci > 0.15
              ? 'Встреч вне графика'
              : 'Конфликтов мало'}
        </div>
      </Card>
    </div>
  )
}
