import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

import { ActivityEvent } from '@/entities/activity-event/model/types'
import { ScheduleException } from '@/entities/exception/model/types'
import { CalendarIcon, CheckSmallIcon } from '@/shared/icons'
import { formatDateRange, MEETINGS_FORMS, pluralizeRu } from '@/shared/lib/format'

import s from './ImpactPanel.module.scss'

interface Props {
  exceptions: ScheduleException[]
  events: ActivityEvent[]
}

interface ImpactRow {
  exceptionId: string
  range: string
  meetingsCount: number
}

function countEventsInRange(events: ActivityEvent[], startIso: string, endIso: string): number {
  const start = parseISO(startIso).getTime()
  const end = parseISO(endIso).getTime()
  return events.filter((e) => {
    const eventStart = parseISO(e.startDt).getTime()
    const eventEnd = parseISO(e.endDt).getTime()
    return eventStart < end && eventEnd > start
  }).length
}

export function ImpactPanel({ exceptions, events }: Props) {
  const impacts: ImpactRow[] = exceptions
    .filter((e) => e.status !== 'completed')
    .map((e) => ({
      exceptionId: e.id,
      range: formatDateRange(e.startDt, e.endDt),
      meetingsCount: countEventsInRange(events, e.startDt, e.endDt),
    }))
    .filter((row) => row.meetingsCount > 0)

  const upcomingVacation = exceptions.find((e) => e.type === 'vacation' && e.status !== 'completed')

  const isEmpty = impacts.length === 0 && !upcomingVacation
  if (isEmpty) {
    return <div className={s.empty}>Активных исключений с влиянием на команду пока нет.</div>
  }

  return (
    <div className={s.list}>
      {impacts.map((row) => (
        <div key={row.exceptionId} className={s.row}>
          <span className={s.iconBlue}>
            <CalendarIcon width={16} height={16} />
          </span>
          <span className={s.text}>
            В ваше отсутствие <strong>{row.range}</strong> назначено{' '}
            <strong>
              {row.meetingsCount} {pluralizeRu(row.meetingsCount, MEETINGS_FORMS)}
            </strong>{' '}
            — система уведомила организаторов.
          </span>
        </div>
      ))}
      {upcomingVacation && (
        <div className={s.row}>
          <span className={s.iconGreen}>
            <CheckSmallIcon width={16} height={16} />
          </span>
          <span className={s.text}>
            Отпуск ({format(parseISO(upcomingVacation.startDt), 'LLLL', { locale: ru })}) учтён в
            планировании следующего спринта.
          </span>
        </div>
      )}
    </div>
  )
}
