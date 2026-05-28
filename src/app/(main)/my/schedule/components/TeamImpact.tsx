'use client'

import { getTimezoneLabel } from '@/entities/schedule/model/options'
import { Card, CardHeader } from '@/shared/ui/Card'

import s from './TeamImpact.module.scss'

interface Props {
  startTime: string
  endTime: string
  timezone: string
}

export function TeamImpact({ startTime, endTime, timezone }: Props) {
  const tzLabel = getTimezoneLabel(timezone)

  return (
    <Card padding="lg">
      <CardHeader title="Как это влияет на команду" />
      <ul className={s.list}>
        <li className={s.item}>
          <span className={s.bullet} aria-hidden="true">
            📅
          </span>
          <span>
            Команда видит вас доступным{' '}
            <span className={s.strong}>
              {startTime}–{endTime}
            </span>{' '}
            по {tzLabel}
          </span>
        </li>
        <li className={s.item}>
          <span className={s.bullet} aria-hidden="true">
            🌍
          </span>
          <span>
            Коллеги в других часовых поясах увидят это окно в своём локальном времени — пересечения
            рассчитываются автоматически.
          </span>
        </li>
        <li className={s.item}>
          <span className={s.bullet} aria-hidden="true">
            ⚡
          </span>
          <span>Актуальный график снижает число конфликтов встреч</span>
        </li>
      </ul>
    </Card>
  )
}
