'use client'

import { useMemo } from 'react'
import cn from 'classnames'

import { ActivityEvent } from '@/entities/activity-event/model/types'
import { Card, CardHeader } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'

import s from './AvailabilityPreview.module.scss'

interface Props {
  startTime: string // "HH:MM"
  endTime: string // "HH:MM"
  events: ActivityEvent[] | null
  isLoading: boolean
}

interface Row {
  key: string
  time: string
  title: string
  tone: 'work' | 'event' | 'outside'
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${hh}:${mm}`
}

function isSameDayAs(iso: string, day: Date): boolean {
  const d = new Date(iso)
  return (
    d.getFullYear() === day.getFullYear() &&
    d.getMonth() === day.getMonth() &&
    d.getDate() === day.getDate()
  )
}

export function AvailabilityPreview({ startTime, endTime, events, isLoading }: Props) {
  const rows = useMemo<Row[]>(() => {
    const today = new Date()
    const todays = (events ?? [])
      .filter((e) => isSameDayAs(e.startDt, today))
      .sort((a, b) => a.startDt.localeCompare(b.startDt))

    const items: Row[] = [
      { key: 'start', time: startTime, tone: 'work', title: 'Начало рабочего дня' },
    ]
    for (const e of todays) {
      items.push({
        key: e.id,
        time: formatTime(e.startDt),
        title: e.title,
        tone: e.isOutsideSchedule ? 'outside' : 'event',
      })
    }
    items.push({ key: 'end', time: endTime, tone: 'work', title: 'Конец рабочего дня' })
    return items
  }, [startTime, endTime, events])

  return (
    <Card padding="lg">
      <CardHeader title="Предпросмотр доступности" />
      <div className={s.subtitle}>Как вас видит команда сегодня</div>

      {isLoading && events === null ? (
        <div className={s.skeletons}>
          <Skeleton height={20} />
          <Skeleton height={20} />
          <Skeleton height={20} />
        </div>
      ) : (
        <ul className={s.list}>
          {rows.map((row) => (
            <li key={row.key} className={s.row}>
              <span className={s.time}>{row.time}</span>
              <span className={cn(s.dot, s[`dot_${row.tone}`])} aria-hidden="true" />
              <span className={cn(s.title, row.tone === 'outside' && s.titleOutside)}>
                {row.title}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
