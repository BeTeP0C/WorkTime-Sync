import { useMemo } from 'react'

import { Employee } from '@/entities/employee/model/types'
import { TeamAvailability } from '@/entities/team/model/types'
import { Badge } from '@/shared/ui/Badge'
import { Card, CardHeader } from '@/shared/ui/Card'

import { computeProblemDays } from './lib/computeProblemDays'

import s from './TeamProblemDays.module.scss'

interface TeamProblemDaysProps {
  availability: TeamAvailability
  members: Employee[]
  weekStart: Date
  majorityTimezone?: string | null
  daysCount?: number
}

export function TeamProblemDays({
  availability,
  members,
  weekStart,
  majorityTimezone,
  daysCount = 7,
}: TeamProblemDaysProps) {
  const days = useMemo(
    () =>
      computeProblemDays(availability, members, weekStart, {
        daysCount,
        majorityTimezone: majorityTimezone ?? null,
      }),
    [availability, members, weekStart, majorityTimezone, daysCount]
  )

  return (
    <Card padding="md">
      <CardHeader title="Проблемные дни" />
      {days.length === 0 ? (
        <div className={s.empty}>
          В пределах выбранной недели команда стабильно доступна — критичных просадок нет.
        </div>
      ) : (
        <div className={s.problems}>
          {days.map((day) => (
            <div key={day.dayIdx} className={s.problemRow}>
              <Badge tone={day.severity === 'error' ? 'critical' : 'warning'} size="sm">
                {day.dayLabel}
              </Badge>
              {day.reasons.length > 0 ? (
                <div className={s.problemReason}>{day.reasons.join('; ')}</div>
              ) : (
                <div className={s.problemReason}>Часть команды не доступна весь день</div>
              )}
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
