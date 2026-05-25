'use client'

import { format, parseISO, startOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'

import { Employee } from '@/entities/employee/model/types'
import { TeamAvailability } from '@/entities/team/model/types'
import { Card, CardHeader } from '@/shared/ui/Card'

import s from './ScheduleTimeline.module.scss'

const HOUR_START = 8
const HOUR_END = 20
const HOUR_WIDTH = 56

interface ScheduleTimelineProps {
  availability: TeamAvailability
  members: Employee[]
  /** Какой день показать (обычно среда выбранной недели) */
  date: Date
}

interface Segment {
  startPct: number
  widthPct: number
  type: 'work' | 'meeting' | 'conflict' | 'outside'
}

function windowsToSegments(windows: { startDt: string; endDt: string }[], date: Date): Segment[] {
  const dayStart = startOfDay(date)
  const totalHours = HOUR_END - HOUR_START

  const segments: Segment[] = []
  for (const w of windows) {
    const start = parseISO(w.startDt)
    const end = parseISO(w.endDt)
    if (startOfDay(start).getTime() !== dayStart.getTime()) continue

    const startHr = start.getHours() + start.getMinutes() / 60
    const endHr = end.getHours() + end.getMinutes() / 60

    const segStart = Math.max(HOUR_START, startHr)
    const segEnd = Math.min(HOUR_END, endHr)
    if (segEnd <= segStart) continue

    segments.push({
      startPct: ((segStart - HOUR_START) / totalHours) * 100,
      widthPct: ((segEnd - segStart) / totalHours) * 100,
      type: 'work',
    })
  }

  return segments
}

export function ScheduleTimeline({ availability, members, date }: ScheduleTimelineProps) {
  const hours: number[] = []
  for (let h = HOUR_START; h <= HOUR_END; h += 2) hours.push(h)
  const dateLabel = `${format(date, 'EEEE', { locale: ru })} ${format(date, 'd MMMM', { locale: ru })}`
  const memberById = new Map(members.map((m) => [m.id, m]))

  return (
    <Card padding="md" className={s.card}>
      <CardHeader title={`Расписание сотрудников · ${dateLabel}`} />

      <div className={s.scroll}>
        <div className={s.grid}>
          <div className={s.empty} />
          <div className={s.hoursRow} style={{ width: (HOUR_END - HOUR_START) * (HOUR_WIDTH / 2) }}>
            {hours.map((h) => (
              <div key={h} className={s.hourLabel} style={{ width: HOUR_WIDTH }}>
                {`${h}:00`}
              </div>
            ))}
          </div>
          <div className={s.empty} />

          {availability.employees.map((empAv) => {
            const member = memberById.get(empAv.employeeId)
            if (!member) return null
            const segments = windowsToSegments(empAv.availableWindows, date)

            return (
              <div key={empAv.employeeId} className={s.row}>
                <div className={s.name}>{shorten(member.fullName)}</div>
                <div
                  className={s.track}
                  style={{ width: (HOUR_END - HOUR_START) * (HOUR_WIDTH / 2) }}
                >
                  {segments.map((seg, i) => (
                    <div
                      key={i}
                      className={`${s.seg} ${s[`seg_${seg.type}`]}`}
                      style={{ left: `${seg.startPct}%`, width: `${seg.widthPct}%` }}
                    />
                  ))}
                </div>
                <div className={s.tz}>{tzShort(member.timezoneLabel)}</div>
              </div>
            )
          })}
        </div>
      </div>

      <div className={s.legend}>
        <LegendChip color="#dbe6fe" label="Рабочее время" />
        <LegendChip color="#2563eb" label="Занят / встреча" />
        <LegendChip color="#fda4af" label="Конфликт" />
        <LegendChip color="#fef3c7" label="Вне графика (другой ТЗ)" />
      </div>
    </Card>
  )
}

function LegendChip({ color, label }: { color: string; label: string }) {
  return (
    <span className={s.legendChip}>
      <span className={s.legendSwatch} style={{ background: color }} />
      {label}
    </span>
  )
}

function shorten(fullName: string): string {
  const parts = fullName.split(' ')
  if (parts.length < 2) return fullName
  return `${parts[0]} ${parts[1][0]}.`
}

function tzShort(label: string): string {
  return label.split(' ')[0]
}
