'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { addDays } from 'date-fns'
import { observer } from 'mobx-react-lite'

import { useAuthStore } from '@/app-store/context'
import { TeamPageInitialData, TeamPageStore } from '@/app-store/stores/TeamPageStore'
import { isManagementRole } from '@/entities/auth/model/types'
import { CalendarIcon, ChartTreeIcon, SignOutIcon } from '@/shared/icons'
import {
  buildHeatmapMatrix,
  filterAvailability,
  findFullAvailabilityWindows,
  findMajorityWindows,
} from '@/shared/lib/availability'
import { formatDateRange } from '@/shared/lib/format'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { useConfirm } from '@/shared/ui/ConfirmDialog'
import { AppHeader } from '@/widgets/AppHeader'
import { HeatmapControls, HeatmapGrid } from '@/widgets/HeatmapGrid'
import { MeetingFinderPanel } from '@/widgets/MeetingFinderPanel'
import { RoadmapPreview } from '@/widgets/RoadmapPreview'
import { ScheduleTimeline } from '@/widgets/ScheduleTimeline'
import { TeamProblemDays } from '@/widgets/TeamProblemDays'

import s from './TeamPageClient.module.scss'

interface Props {
  teamId: string
  initialData: TeamPageInitialData | null
}

export const TeamPageClient = observer(function TeamPageClient({ teamId, initialData }: Props) {
  const [store] = useState(() => new TeamPageStore(teamId, initialData ?? undefined))
  const auth = useAuthStore()
  const confirm = useConfirm()
  const canManage = isManagementRole(auth.currentUser.value?.role)

  useEffect(() => {
    if (!store.loadingStage.isSuccessful) store.fetch()
  }, [store])

  const handleRemoveMember = async (employeeId: string) => {
    const member = store.members.value.find((m) => m.id === employeeId)
    const teamName = store.team.value?.name ?? 'команда'
    const ok = await confirm({
      title: 'Удалить участника из команды?',
      body: `${member?.fullName ?? 'Сотрудник'} будет исключён из «${teamName}». Сам сотрудник останется в системе.`,
      confirmLabel: 'Удалить',
      danger: true,
    })
    if (!ok) return
    await store.removeMember(employeeId)
  }

  const team = store.team.value
  const members = store.members.value
  const availability = store.availability.value
  const meetings = store.meetingRecommendations.value
  const weekStart = store.selectedWeekStart.value
  const daysCount = store.selectedDaysCount.value
  const hourRange = store.selectedHourRange.value
  const heatmapMode = store.heatmapMode.value
  const excludedMemberIds = store.excludedMemberIds.value
  const weekEnd = addDays(weekStart, Math.max(1, daysCount) - 1)
  const middleDay = addDays(weekStart, Math.min(2, Math.max(0, daysCount - 1)))

  const fullWindows = useMemo(() => {
    if (!availability || !members.length) return []
    const filtered = filterAvailability(availability, excludedMemberIds)
    const total = filtered.employees.length
    if (total === 0) return []
    const matrix = buildHeatmapMatrix(filtered, {
      startDate: weekStart,
      daysCount,
      startHour: hourRange[0],
      endHour: hourRange[1],
    })
    const full = findFullAvailabilityWindows(matrix)
      .filter((w) => w.endHour - w.startHour >= 1)
      .slice(0, 2)
      .map((w) => {
        const day = matrix.days[w.dayIdx]
        return {
          dayLabel: `${day.weekdayLabel} ${day.label}`,
          range: `${String(w.startHour).padStart(2, '0')}:00 — ${String(w.endHour).padStart(2, '0')}:00`,
          note: `Все ${total} участников доступны`,
        }
      })
    if (full.length >= 2) return full

    const majority = findMajorityWindows(matrix, 0.75)
      .filter((w) => w.endHour - w.startHour >= 1)
      .sort((a, b) => b.endHour - b.startHour - (a.endHour - a.startHour))
      .slice(0, 2 - full.length)
      .map((w) => {
        const day = matrix.days[w.dayIdx]
        const avg = Math.round(w.avgAvailable)
        return {
          dayLabel: `${day.weekdayLabel} ${day.label}`,
          range: `${String(w.startHour).padStart(2, '0')}:00 — ${String(w.endHour).padStart(2, '0')}:00`,
          note: `${avg} из ${total} участников доступны`,
        }
      })

    return [...full, ...majority]
  }, [availability, members.length, weekStart, daysCount, hourRange, excludedMemberIds])

  const majorityTimezone = useMemo(() => {
    if (!members.length) return null
    const counts = new Map<string, number>()
    for (const m of members) counts.set(m.timezone, (counts.get(m.timezone) ?? 0) + 1)
    let best: { tz: string; count: number } | null = null
    for (const [tz, count] of counts) {
      if (!best || count > best.count) best = { tz, count }
    }
    return best?.tz ?? null
  }, [members])

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
        breadcrumb={
          <Link href="/teams" className={s.crumbLink}>
            <ChartTreeIcon className={s.crumbIcon} />
            Команды
          </Link>
        }
        title={
          <span className={s.titleRow}>
            <Avatar
              initials={team.initials}
              fullName={team.name}
              colorSeed={team.id}
              src={team.avatarUrl}
              shape="squircle"
              size="sm"
            />
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
            <Button variant="secondary" size="md" leftIcon={<CalendarIcon />}>
              {formatDateRange(weekStart.toISOString(), weekEnd.toISOString())}
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<SignOutIcon />}
              onClick={() => store.findMeeting()}
            >
              Найти время для встречи
            </Button>
          </>
        }
      />

      <div className={s.layout}>
        <div className={s.mainColumn}>
          <Card padding="md">
            <HeatmapControls
              weekStart={weekStart}
              daysCount={daysCount}
              hourRange={hourRange}
              mode={heatmapMode}
              members={members}
              excludedMemberIds={excludedMemberIds}
              onPrevWeek={() => store.shiftWeek(-1)}
              onNextWeek={() => store.shiftWeek(1)}
              onToday={() => store.setWeekToToday()}
              onDaysChange={(d) => store.selectedDaysCount.change(d)}
              onHoursChange={(r) => store.selectedHourRange.change(r)}
              onModeChange={(m) => store.heatmapMode.change(m)}
              onToggleMember={(id) => store.toggleExcluded(id)}
              onResetMembers={() => store.resetExcluded()}
            />
          </Card>

          <HeatmapGrid
            availability={availability}
            members={members}
            startDate={weekStart}
            daysCount={daysCount}
            startHour={hourRange[0]}
            endHour={hourRange[1]}
            mode={heatmapMode}
            excludedMemberIds={excludedMemberIds}
            meta={`${members.length - excludedMemberIds.size} из ${members.length} участников · UTC+3`}
          />

          <ScheduleTimeline
            availability={availability}
            members={members}
            date={middleDay}
            onRemoveMember={canManage ? handleRemoveMember : undefined}
          />
        </div>

        <aside className={s.side}>
          <Card padding="md">
            <h3 className={s.cardTitle}>Общее окно команды</h3>
            {fullWindows.length === 0 ? (
              <div className={s.windowEmpty}>
                Нет окон, где доступно большинство — попробуйте сменить неделю или воспользуйтесь
                поиском встречи ниже.
              </div>
            ) : (
              <div className={s.windows}>
                {fullWindows.map((w, i) => (
                  <div key={i} className={s.window}>
                    <div className={s.windowTime}>{w.range}</div>
                    <div className={s.windowDays}>{w.dayLabel}</div>
                    <div className={s.windowNote}>{w.note}</div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <TeamProblemDays
            availability={availability}
            members={members}
            weekStart={weekStart}
            majorityTimezone={majorityTimezone}
            daysCount={7}
          />

          <RoadmapPreview scope={{ kind: 'team', teamId }} limit={3} />

          <MeetingFinderPanel
            recommendations={meetings}
            members={members}
            teamId={teamId}
            teamName={team.name}
          />
        </aside>
      </div>
    </>
  )
})
