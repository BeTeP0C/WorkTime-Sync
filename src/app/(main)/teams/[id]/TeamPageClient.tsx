'use client'

import { useEffect, useMemo, useState } from 'react'
import { addDays } from 'date-fns'
import { observer } from 'mobx-react-lite'

import { TeamPageStore } from '@/app-store/stores/TeamPageStore'
import { formatDateRange } from '@/shared/lib/format'
import { Avatar } from '@/shared/ui/Avatar'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'
import { AppHeader } from '@/widgets/AppHeader'
import { HeatmapGrid } from '@/widgets/HeatmapGrid'
import { MeetingFinderPanel } from '@/widgets/MeetingFinderPanel'
import { ScheduleTimeline } from '@/widgets/ScheduleTimeline'

import s from './TeamPageClient.module.scss'

interface Props {
  teamId: string
}

export const TeamPageClient = observer(function TeamPageClient({ teamId }: Props) {
  const [store] = useState(() => new TeamPageStore(teamId))

  useEffect(() => {
    store.fetch()
  }, [store])

  const team = store.team.value
  const members = store.members.value
  const availability = store.availability.value
  const meetings = store.meetingRecommendations.value
  const weekStart = store.selectedWeekStart.value
  const weekEnd = addDays(weekStart, 5)
  const middleDay = addDays(weekStart, 2)

  const fullWindows = useMemo(() => {
    if (!availability || !members.length) return []
    const total = availability.employees.length
    // Используем матрицу косвенно через MeetingFinder — здесь захардкодим
    const result: { dayLabel: string; range: string; note: string }[] = []

    // Заглушка: возьмём данные из meeting-рекоммендаций
    if (meetings[0]) {
      result.push({
        dayLabel: 'Пн, Вт, Чт',
        range: '10:00 — 12:00',
        note: `Все ${total} участников доступны`,
      })
    }
    if (meetings[1]) {
      result.push({
        dayLabel: 'Пн, Вт, Ср, Чт',
        range: '14:00 — 16:00',
        note: `6 из ${total} участников`,
      })
    }
    return result
  }, [availability, members.length, meetings])

  if (!team || !availability) {
    return (
      <>
        <AppHeader title="Загрузка команды..." />
        <div className={s.empty}>Загружаем данные команды…</div>
      </>
    )
  }

  const visibleAvatars = members.slice(0, 5)
  const hiddenCount = Math.max(0, members.length - visibleAvatars.length)

  return (
    <>
      <AppHeader
        title={
          <span className={s.titleRow}>
            {team.name}
            <span className={s.avatarStack}>
              {visibleAvatars.map((m) => (
                <Avatar
                  key={m.id}
                  initials={m.initials}
                  fullName={m.fullName}
                  colorSeed={m.id}
                  size="sm"
                  className={s.avatarChip}
                />
              ))}
              {hiddenCount > 0 && <span className={s.avatarCounter}>+{hiddenCount}</span>}
            </span>
          </span>
        }
        action={
          <>
            <Button variant="secondary" size="md">
              📅 {formatDateRange(weekStart.toISOString(), weekEnd.toISOString())}
            </Button>
            <Button variant="primary" size="md" onClick={() => store.findMeeting()}>
              Найти время для встречи
            </Button>
          </>
        }
      />

      <div className={s.layout}>
        <div className={s.mainColumn}>
          <HeatmapGrid
            availability={availability}
            members={members}
            startDate={weekStart}
            meta={`${members.length} сотрудников · UTC+3`}
          />

          <ScheduleTimeline availability={availability} members={members} date={middleDay} />
        </div>

        <aside className={s.side}>
          <Card padding="md">
            <CardHeader title="Общее окно команды" />
            <div className={s.windows}>
              {fullWindows.map((w, i) => (
                <div
                  key={i}
                  className={`${s.window} ${i === 0 ? s.windowPrimary : s.windowSecondary}`}
                >
                  <div className={s.windowTime}>{w.range}</div>
                  <div className={s.windowDays}>{w.dayLabel}</div>
                  <div className={s.windowNote}>{w.note}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card padding="md">
            <CardHeader title="Проблемные дни" />
            <div className={s.problems}>
              <div className={s.problemRow}>
                <Badge tone="warning" size="sm">
                  Пятница 23 мая
                </Badge>
                <div className={s.problemReason}>
                  Михаил Петров — командировка; Наталья Смирнова — плотный календарь
                </div>
              </div>
              <div className={s.problemRow}>
                <Badge tone="warning" size="sm">
                  Суббота–воскресенье
                </Badge>
                <div className={s.problemReason}>5 из 7 сотрудников не работают в эти дни</div>
              </div>
            </div>
          </Card>

          <MeetingFinderPanel recommendations={meetings} members={members} />
        </aside>
      </div>
    </>
  )
})
