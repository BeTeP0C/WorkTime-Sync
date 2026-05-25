'use client'

import { Employee } from '@/entities/employee/model/types'
import { TeamAvailability } from '@/entities/team/model/types'
import { buildHeatmapMatrix } from '@/shared/lib/availability'
import { HEATMAP_LEGEND_COLORS, heatmapColor, heatmapTextColor } from '@/shared/lib/colorScale'
import { Card, CardHeader } from '@/shared/ui/Card'
import { Tooltip } from '@/shared/ui/Tooltip'

import s from './HeatmapGrid.module.scss'

interface HeatmapGridProps {
  availability: TeamAvailability
  members: Employee[]
  startDate: Date
  /** Подпись справа от заголовка */
  meta?: string
}

const HOURS_START = 9
const HOURS_END = 18
const DAYS_COUNT = 6

export function HeatmapGrid({ availability, members, startDate, meta }: HeatmapGridProps) {
  const matrix = buildHeatmapMatrix(availability, {
    startDate,
    daysCount: DAYS_COUNT,
    startHour: HOURS_START,
    endHour: HOURS_END,
  })

  const employeeById = new Map(members.map((e) => [e.id, e]))

  return (
    <Card padding="md" className={s.card}>
      <CardHeader
        title="Тепловая карта доступности"
        action={meta && <span className={s.meta}>{meta}</span>}
      />

      <div className={s.gridWrapper}>
        <div className={s.grid} style={{ gridTemplateColumns: `60px repeat(${DAYS_COUNT}, 1fr)` }}>
          <div className={s.headerCell}>Час</div>
          {matrix.days.map((d) => (
            <div key={d.label} className={s.headerCell}>
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
            />
          ))}
        </div>
      </div>

      <div className={s.legend}>
        <span className={s.legendLabel}>0 чел.</span>
        <div className={s.legendBar}>
          {HEATMAP_LEGEND_COLORS.map((color) => (
            <span key={color} className={s.legendChip} style={{ background: color }} />
          ))}
        </div>
        <span className={s.legendLabel}>{matrix.totalMembers} чел.</span>
      </div>
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
}

function Row({ hour, counts, available, totalMembers, employeeById, days }: RowProps) {
  return (
    <>
      <div className={s.hourCell}>{`${String(hour).padStart(2, '0')}:00`}</div>
      {counts.map((count, dIdx) => {
        const bg = heatmapColor(count, totalMembers)
        const color = heatmapTextColor(count, totalMembers)
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
              {count > 0 ? count : ''}
            </div>
          </Tooltip>
        )
      })}
    </>
  )
}
