import cn from 'classnames'
import { format, isSameDay, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

import { ActivityEvent, EVENT_TYPE_LABEL_RU } from '@/entities/activity-event/model/types'
import { Card, CardHeader } from '@/shared/ui/Card'

import s from './UpcomingEventsList.module.scss'

interface UpcomingEventsListProps {
  events: ActivityEvent[]
  /** Идёт ли первое событие прямо сейчас. */
  nowEventId?: string | null
  title?: string
  emptyText?: string
}

function relativeWhen(startIso: string, endIso: string): { label: string; isNow: boolean } {
  const start = parseISO(startIso)
  const end = parseISO(endIso)
  const now = new Date()
  const isNow = now >= start && now <= end
  const today = isSameDay(start, now)
  const tomorrow = new Date(now)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const isTomorrow = isSameDay(start, tomorrow)
  const time = format(start, 'HH:mm', { locale: ru })
  if (today) return { label: `Сегодня, ${time}`, isNow }
  if (isTomorrow) return { label: `Завтра, ${time}`, isNow }
  return { label: format(start, 'EEEE, HH:mm', { locale: ru }), isNow }
}

function eventTone(event: ActivityEvent): 'now' | 'conflict' | 'planned' {
  if (event.isOutsideSchedule) return 'conflict'
  return 'planned'
}

function eventTypeLabel(event: ActivityEvent): string {
  return (EVENT_TYPE_LABEL_RU as Record<string, string>)[event.eventType] ?? 'Событие'
}

export function UpcomingEventsList({
  events,
  nowEventId,
  title = 'Ближайшие события',
  emptyText = 'Нет ближайших событий',
}: UpcomingEventsListProps) {
  return (
    <Card padding="lg" className={s.card}>
      <CardHeader title={title} />
      {events.length === 0 ? (
        <div className={s.empty}>{emptyText}</div>
      ) : (
        <ul className={s.list}>
          {events.map((event) => {
            const when = relativeWhen(event.startDt, event.endDt)
            const tone = when.isNow || event.id === nowEventId ? 'now' : eventTone(event)
            return (
              <li key={event.id} className={cn(s.item, s[`tone_${tone}`])}>
                <div className={s.head}>
                  <span className={s.title}>{event.title}</span>
                  <span className={cn(s.badge, s[`badge_${tone}`])}>
                    {tone === 'now'
                      ? 'Сейчас'
                      : tone === 'conflict'
                        ? 'Конфликт'
                        : eventTypeLabel(event)}
                  </span>
                </div>
                <div className={s.when}>{when.label}</div>
              </li>
            )
          })}
        </ul>
      )}
    </Card>
  )
}
