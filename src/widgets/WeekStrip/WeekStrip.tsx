import cn from 'classnames'

import { WeekDayBucket } from '@/app-store/stores/EmployeeDashboardStore'
import { WEEKDAY_LABEL_RU, WeekDayIndex } from '@/entities/schedule/model/types'
import { pluralizeRu } from '@/shared/lib/format'
import { Card, CardHeader } from '@/shared/ui/Card'

import s from './WeekStrip.module.scss'

interface WeekStripProps {
  days: WeekDayBucket[]
}

/** Парсим YYYY-MM-DD как локальную дату, без сдвига к UTC. */
function dayNumber(dateIso: string): number {
  const parts = dateIso.split('-')
  return Number(parts[2]) || 0
}

function bucketStatus(bucket: WeekDayBucket): {
  text: string
  tone: 'ok' | 'conflict' | 'empty' | 'busy'
} {
  if (bucket.isWeekend && bucket.eventsCount === 0) return { text: 'Выходной', tone: 'empty' }
  if (bucket.hasConflict) return { text: 'Конфликт', tone: 'conflict' }
  if (bucket.eventsCount === 0) return { text: 'Доступен', tone: 'ok' }
  const noun = pluralizeRu(bucket.eventsCount, ['встреча', 'встречи', 'встреч'])
  return { text: noun, tone: 'busy' }
}

export function WeekStrip({ days }: WeekStripProps) {
  return (
    <Card padding="lg" className={s.card}>
      <CardHeader title="Мой график на эту неделю" />
      <div className={s.grid}>
        {days.map((bucket) => {
          const status = bucketStatus(bucket)
          const label = WEEKDAY_LABEL_RU[bucket.weekday as WeekDayIndex]
          return (
            <div
              key={bucket.dateIso}
              className={cn(
                s.day,
                bucket.isToday && s.dayToday,
                bucket.isWeekend && s.dayWeekend,
                bucket.hasConflict && s.dayConflict
              )}
            >
              <div className={s.head}>
                {label} {dayNumber(bucket.dateIso)}
              </div>
              <div className={s.value}>
                {bucket.eventsCount === 0
                  ? bucket.isWeekend
                    ? '—'
                    : '✓'
                  : bucket.hasConflict
                    ? '⚠'
                    : bucket.eventsCount}
              </div>
              <div className={cn(s.status, s[`tone_${status.tone}`])}>{status.text}</div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}
