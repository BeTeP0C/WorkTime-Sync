import cn from 'classnames'

import { EmployeeMetric } from '@/entities/employee/model/types'
import { Card } from '@/shared/ui/Card'
import { ProgressBar, ProgressTone } from '@/shared/ui/ProgressBar'

import s from './MyMetricsCards.module.scss'

interface MyMetricsCardsProps {
  metric: EmployeeMetric
}

function aiTone(value: number): ProgressTone {
  if (value < 0.4) return 'critical'
  if (value < 0.7) return 'high'
  return 'success'
}

function liTone(value: number): ProgressTone {
  if (value > 1.0) return 'critical'
  if (value > 0.8) return 'high'
  return 'success'
}

function ciTone(value: number): ProgressTone {
  if (value > 0.35) return 'critical'
  if (value > 0.15) return 'high'
  return 'success'
}

function riTone(value: number): ProgressTone {
  if (value >= 0.7) return 'critical'
  if (value >= 0.5) return 'high'
  if (value >= 0.3) return 'medium'
  return 'success'
}

function aiHint(value: number): string {
  if (value < 0.4) return 'Требует обновления'
  if (value < 0.7) return 'Скоро потребует обновления'
  return 'В норме'
}

function liHint(value: number): string {
  if (value > 1.0) return 'Перегружен (порог 100%)'
  if (value > 0.8) return 'Перегружен (порог 80%)'
  return 'В пределах нормы'
}

function ciHint(value: number): string {
  if (value > 0.35) return 'Много встреч вне графика'
  if (value > 0.15) return 'Есть встречи вне графика'
  return 'Конфликтов мало'
}

function riHint(value: number): string {
  if (value >= 0.7) return 'Критический риск неактуальности'
  if (value >= 0.5) return 'Высокий риск'
  if (value >= 0.3) return 'Средний риск'
  return 'Низкий риск'
}

export function MyMetricsCards({ metric }: MyMetricsCardsProps) {
  const ai = metric.actualityScore
  const li = metric.loadLevel
  const ci = metric.conflictRate
  const ri = metric.riskScore

  const ai_t = aiTone(ai)
  const li_t = liTone(li)
  const ci_t = ciTone(ci)
  const ri_t = riTone(ri)

  return (
    <div className={s.grid}>
      <Card padding="lg" className={s.card}>
        <div className={s.label}>Актуальность Ai</div>
        <div className={cn(s.value, s[`tone_${ai_t}`])}>{ai.toFixed(2)}</div>
        <div className={s.barRow}>
          <ProgressBar value={ai} tone={ai_t} size="lg" />
          <span className={s.percent}>{Math.round(ai * 100)}%</span>
        </div>
        <div className={cn(s.hint, s[`tone_${ai_t}`])}>{aiHint(ai)}</div>
      </Card>

      <Card padding="lg" className={s.card}>
        <div className={s.label}>Загрузка Li</div>
        <div className={cn(s.value, s[`tone_${li_t}`])}>{li.toFixed(2)}</div>
        <div className={s.barRow}>
          <ProgressBar value={Math.min(li, 1.2)} max={1.2} tone={li_t} size="lg" />
          <span className={s.percent}>{Math.round(li * 100)}%</span>
        </div>
        <div className={cn(s.hint, s[`tone_${li_t}`])}>{liHint(li)}</div>
      </Card>

      <Card padding="lg" className={s.card}>
        <div className={s.label}>Конфликты Ci</div>
        <div className={cn(s.value, s[`tone_${ci_t}`])}>{Math.round(ci * 100)}%</div>
        <div className={s.barRow}>
          <ProgressBar value={ci} tone={ci_t} size="lg" />
          <span className={s.percent}>{Math.round(ci * 100)}%</span>
        </div>
        <div className={cn(s.hint, s[`tone_${ci_t}`])}>{ciHint(ci)}</div>
      </Card>

      <Card padding="lg" className={s.card}>
        <div className={s.label}>Риск Ri</div>
        <div className={cn(s.value, s[`tone_${ri_t}`])}>{ri.toFixed(2)}</div>
        <div className={s.barRow}>
          <ProgressBar value={ri} tone={ri_t} size="lg" />
          <span className={s.percent}>{Math.round(ri * 100)}%</span>
        </div>
        <div className={cn(s.hint, s[`tone_${ri_t}`])}>{riHint(ri)}</div>
      </Card>
    </div>
  )
}
