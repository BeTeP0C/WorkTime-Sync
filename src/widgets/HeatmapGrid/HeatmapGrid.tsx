'use client'

import { useMemo } from 'react'

import { Employee } from '@/entities/employee/model/types'
import { TeamAvailability } from '@/entities/team/model/types'
import { buildHeatmapMatrix, filterAvailability } from '@/shared/lib/availability'
import { heatmapColor, heatmapTextColor } from '@/shared/lib/colorScale'
import { Card, CardHeader } from '@/shared/ui/Card'
import { Tooltip } from '@/shared/ui/Tooltip'

import s from './HeatmapGrid.module.scss'

export type HeatmapMode = 'majority' | 'all'

interface HeatmapGridProps {
  availability: TeamAvailability
  members: Employee[]
  startDate: Date
  /** Подпись справа от заголовка */
  meta?: string
  /** Сколько дней отрисовать (5 — рабочая, 7 — полная). */
  daysCount?: number
  /** Окно часов [startHour, endHour] включительно. */
  startHour?: number
  endHour?: number
  /** 'majority' — градиент opacity; 'all' — бинарно «все/нет». */
  mode?: HeatmapMode
  /** Сотрудники, исключённые из подсчёта. */
  excludedMemberIds?: ReadonlySet<string>
}

const DEFAULT_EXCLUDED: ReadonlySet<string> = new Set<string>()

export function HeatmapGrid({
  availability,
  members,
  startDate,
  meta,
  daysCount = 7,
  startHour = 9,
  endHour = 18,
  mode = 'majority',
  excludedMemberIds = DEFAULT_EXCLUDED,
}: HeatmapGridProps) {
  const effectiveAvailability = useMemo(
    () => filterAvailability(availability, excludedMemberIds),
    [availability, excludedMemberIds]
  )

  const matrix = useMemo(
    () =>
      buildHeatmapMatrix(effectiveAvailability, {
        startDate,
        daysCount,
        startHour,
        endHour,
      }),
    [effectiveAvailability, startDate, daysCount, startHour, endHour]
  )

  const employeeById = useMemo(() => new Map(members.map((e) => [e.id, e])), [members])

  return (
    <Card padding="md" className={s.card}>
      <CardHeader
        title="Командная карта доступности"
        action={meta && <span className={s.meta}>{meta}</span>}
      />

      <div className={s.gridWrapper}>
        <div className={s.grid} style={{ gridTemplateColumns: `60px repeat(${daysCount}, 1fr)` }}>
          <div className={s.headerCell}>Час</div>
          {matrix.days.map((d) => (
            <div key={`${d.weekdayLabel}-${d.label}`} className={s.headerCell}>
              <span className={s.weekday}>{d.weekdayLabel}</span> {d.label}
            </div>
          ))}

          {matrix.hours.map((hour, hIdx) => (
            <Row
              key={hour}
              hour={hour}
              counts={matrix.counts[hIdx]}
              available={matrix.available[hIdx]}
              totalMembers={matrix.totalMembers}
              employeeById={employeeById}
              days={matrix.days}
              mode={mode}
            />
          ))}
        </div>
      </div>

      <Legend mode={mode} totalMembers={matrix.totalMembers} />
    </Card>
  )
}

interface RowProps {
  hour: number
  counts: number[]
  available: string[][]
  totalMembers: number
  employeeById: Map<string, Employee>
  days: { date: Date; weekdayLabel: string; label: string }[]
  mode: HeatmapMode
}

function cellColor(count: number, total: number, mode: HeatmapMode): string {
  if (mode === 'all') {
    if (total > 0 && count === total) return heatmapColor(total, total)
    return heatmapColor(0, Math.max(1, total))
  }
  return heatmapColor(count, total)
}

function cellTextColor(count: number, total: number, mode: HeatmapMode): string {
  if (mode === 'all') {
    return total > 0 && count === total ? '#ffffff' : '#909090'
  }
  return heatmapTextColor(count, total)
}

function Row({ hour, counts, available, totalMembers, employeeById, days, mode }: RowProps) {
  return (
    <>
      <div className={s.hourCell}>{`${String(hour).padStart(2, '0')}:00`}</div>
      {counts.map((count, dIdx) => {
        const bg = cellColor(count, totalMembers, mode)
        const color = cellTextColor(count, totalMembers, mode)
        const availableNames = available[dIdx]
          .map((id) => employeeById.get(id)?.fullName)
          .filter(Boolean) as string[]

        return (
          <Tooltip
            key={dIdx}
            content={
              <div>
                <div style={{ marginBottom: 4, fontWeight: 600 }}>
                  {days[dIdx].weekdayLabel} {days[dIdx].label}, {String(hour).padStart(2, '0')}:00
                </div>
                <div>
                  {count} из {totalMembers} доступны
                </div>
                {availableNames.length > 0 && (
                  <div style={{ marginTop: 4, fontSize: 11, opacity: 0.85 }}>
                    {availableNames.join(', ')}
                  </div>
                )}
              </div>
            }
          >
            <div className={s.cell} style={{ background: bg, color }}>
              {count}
            </div>
          </Tooltip>
        )
      })}
    </>
  )
}

interface LegendProps {
  mode: HeatmapMode
  totalMembers: number
}

function Legend({ mode, totalMembers }: LegendProps) {
  if (mode === 'all') {
    return (
      <div className={s.legend}>
        <span className={s.legendLabel}>Не все</span>
        <div className={s.legendBar}>
          <span
            className={s.legendChip}
            style={{ background: heatmapColor(0, Math.max(1, totalMembers)) }}
          />
          <span
            className={s.legendChip}
            style={{ background: heatmapColor(totalMembers, Math.max(1, totalMembers)) }}
          />
        </div>
        <span className={s.legendLabel}>Все {totalMembers} доступны</span>
      </div>
    )
  }

  const steps = [0, 0.25, 0.5, 0.75, 1]
  const counts = steps.map((step) => Math.round(step * totalMembers))

  return (
    <div className={s.legend}>
      <span className={s.legendLabel}>0 чел.</span>
      <div className={s.legendBar}>
        {counts.map((count, i) => (
          <span
            key={i}
            className={s.legendChip}
            title={`${count} чел.`}
            style={{ background: heatmapColor(count, Math.max(1, totalMembers)) }}
          />
        ))}
      </div>
      <span className={s.legendLabel}>{totalMembers} чел.</span>
    </div>
  )
}
