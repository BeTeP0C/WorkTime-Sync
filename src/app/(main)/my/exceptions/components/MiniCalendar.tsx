import cn from 'classnames'
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  isWithinInterval,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { ru } from 'date-fns/locale'

import { ExceptionType, ScheduleException } from '@/entities/exception/model/types'

import s from './MiniCalendar.module.scss'

interface Props {
  exceptions: ScheduleException[]
  monthsCount?: number
}

const WEEKDAYS: string[] = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function MiniCalendar({ exceptions, monthsCount = 2 }: Props) {
  const intervals = exceptions.map((e) => ({
    type: e.type,
    start: parseISO(e.startDt),
    end: parseISO(e.endDt),
  }))

  const baseDate = new Date()
  const months = Array.from({ length: monthsCount }, (_, i) => addMonths(baseDate, i))

  return (
    <div className={s.root}>
      {months.map((monthStart) => (
        <MonthGrid key={format(monthStart, 'yyyy-MM')} month={monthStart} intervals={intervals} />
      ))}
      <Legend />
    </div>
  )
}

interface MonthGridProps {
  month: Date
  intervals: { type: ExceptionType; start: Date; end: Date }[]
}

function MonthGrid({ month, intervals }: MonthGridProps) {
  const monthStart = startOfMonth(month)
  const monthEnd = endOfMonth(month)
  // weekStartsOn: 1 = понедельник
  const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 })
  const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 })

  const days: Date[] = []
  let cursor = gridStart
  while (cursor <= gridEnd) {
    days.push(cursor)
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000)
  }

  return (
    <div className={s.month}>
      <div className={s.monthTitle}>{format(month, 'LLLL yyyy', { locale: ru })}</div>
      <div className={s.weekdays}>
        {WEEKDAYS.map((d) => (
          <span key={d} className={s.weekday}>
            {d}
          </span>
        ))}
      </div>
      <div className={s.days}>
        {days.map((day) => {
          const inMonth = isSameMonth(day, month)
          const hit = intervals.find((iv) =>
            isWithinInterval(day, { start: iv.start, end: iv.end })
          )
          return (
            <span
              key={day.toISOString()}
              className={cn(
                s.day,
                !inMonth && s.outside,
                hit && s.markedBg,
                hit && s[`mark_${hit.type}`],
                isToday(day) && s.today
              )}
            >
              {format(day, 'd')}
            </span>
          )
        })}
      </div>
    </div>
  )
}

function Legend() {
  return (
    <div className={s.legend}>
      <LegendItem className={s.mark_vacation} label="Отпуск" />
      <LegendItem className={s.mark_business_trip} label="Командировка" />
      <LegendItem className={s.mark_sick_leave} label="Больничный" />
      <LegendItem className={s.mark_personal_hours} label="Личные часы" />
    </div>
  )
}

interface LegendItemProps {
  className: string
  label: string
}

function LegendItem({ className, label }: LegendItemProps) {
  return (
    <span className={s.legendItem}>
      <span className={cn(s.legendDot, className)} />
      {label}
    </span>
  )
}
