'use client'

import { format, parseISO, startOfDay } from 'date-fns'
import { ru } from 'date-fns/locale'

import { Employee } from '@/entities/employee/model/types'
import { AvailabilityWindow, TeamAvailability } from '@/entities/team/model/types'
import { XSmallIcon } from '@/shared/icons'
import { Card } from '@/shared/ui/Card'

import s from './ScheduleTimeline.module.scss'

const HOUR_START = 8
const HOUR_END = 20
const HOUR_STEP = 2

type SegmentType = 'work' | 'busy' | 'conflict' | 'outside'

interface ScheduleTimelineProps {
  availability: TeamAvailability
  members: Employee[]
  /** Какой день показать (обычно среда выбранной недели) */
  date: Date
  /** Если передан — у каждой строки появляется кнопка «×» (видна по hover). */
  onRemoveMember?: (employeeId: string) => void
}

interface Segment {
  startPct: number
  widthPct: number
  type: SegmentType
}

function windowsToSegments(
  windows: AvailabilityWindow[],
  date: Date,
  type: SegmentType
): Segment[] {
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
      type,
    })
  }

  return segments
}

export function ScheduleTimeline({
  availability,
  members,
  date,
  onRemoveMember,
}: ScheduleTimelineProps) {
  const hours: number[] = []
  for (let h = HOUR_START; h <= HOUR_END; h += HOUR_STEP) hours.push(h)
  const weekday = format(date, 'EEEE', { locale: ru })
  const dateLabel = `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${format(date, 'd MMMM', { locale: ru })}`
  const memberById = new Map(members.map((m) => [m.id, m]))

  return (
    <Card padding="md" className={s.card}>
      <h3 className={s.title}>{`Расписание сотрудников · ${dateLabel}`}</h3>

      <div className={s.grid}>
        <div className={s.empty} />
        <div className={s.hoursRow}>
          {hours.map((h) => (
            <div key={h} className={s.hourLabel}>
              {`${h}:00`}
            </div>
          ))}
        </div>
        <div className={s.empty} />

        {availability.employees.map((empAv) => {
          const member = memberById.get(empAv.employeeId)
          if (!member) return null
          const segments: Segment[] = [
            ...windowsToSegments(empAv.availableWindows, date, 'work'),
            ...windowsToSegments(empAv.outOfScheduleWindows, date, 'outside'),
            ...windowsToSegments(empAv.conflictWindows, date, 'conflict'),
            ...windowsToSegments(empAv.busyWindows, date, 'busy'),
          ]

          return (
            <div key={empAv.employeeId} className={s.row}>
              <div className={s.name} title={member.fullName}>
                {member.fullName}
              </div>
              <div className={s.track}>
                {segments.map((seg, i) => (
                  <div
                    key={i}
                    className={`${s.seg} ${s[`seg_${seg.type}`]}`}
                    style={{ left: `${seg.startPct}%`, width: `${seg.widthPct}%` }}
                  />
                ))}
              </div>
              <div className={s.tz}>
                <span>{tzShort(member.timezoneLabel)}</span>
                {onRemoveMember && (
                  <button
                    type="button"
                    className={s.removeBtn}
                    onClick={() => onRemoveMember(empAv.employeeId)}
                    aria-label={`Удалить ${member.fullName} из команды`}
                    title="Удалить из команды"
                  >
                    <XSmallIcon width={14} height={14} />
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <div className={s.legend}>
        <LegendChip type="work" label="Рабочее время" />
        <LegendChip type="busy" label="Занят / встреча" />
        <LegendChip type="conflict" label="Конфликт" />
        <LegendChip type="outside" label="Вне графика (другой ТЗ)" />
      </div>
    </Card>
  )
}

function LegendChip({ type, label }: { type: SegmentType; label: string }) {
  return (
    <span className={s.legendChip}>
      <span className={`${s.legendSwatch} ${s[`seg_${type}`]}`} />
      {label}
    </span>
  )
}

function tzShort(label: string): string {
  return label.split(' ')[0]
}
