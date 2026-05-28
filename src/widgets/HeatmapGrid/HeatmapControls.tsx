'use client'

import { useEffect, useRef, useState } from 'react'
import cn from 'classnames'
import { addDays, startOfWeek } from 'date-fns'

import { Employee } from '@/entities/employee/model/types'
import { AngleRightIcon, UserIcon } from '@/shared/icons'
import { formatDateRange } from '@/shared/lib/format'
import { Avatar } from '@/shared/ui/Avatar'
import { Select, SelectOption } from '@/shared/ui/Select'

import type { HeatmapMode } from './HeatmapGrid'

import s from './HeatmapControls.module.scss'

type DaysPreset = '5' | '7'
type HoursPreset = '8-20' | '9-18' | '0-24'

const DAYS_OPTIONS: SelectOption<DaysPreset>[] = [
  { value: '5', label: 'Рабочие дни (5)' },
  { value: '7', label: 'Вся неделя (7)' },
]

const HOURS_OPTIONS: SelectOption<HoursPreset>[] = [
  { value: '9-18', label: 'Рабочее (9-18)' },
  { value: '8-20', label: 'Расширенное (8-20)' },
  { value: '0-24', label: 'Сутки (0-24)' },
]

function hoursPresetFromRange(range: [number, number]): HoursPreset {
  const [s, e] = range
  if (s === 8 && e === 20) return '8-20'
  if (s === 0 && e === 24) return '0-24'
  return '9-18'
}

function rangeFromPreset(preset: HoursPreset): [number, number] {
  if (preset === '8-20') return [8, 20]
  if (preset === '0-24') return [0, 24]
  return [9, 18]
}

interface HeatmapControlsProps {
  weekStart: Date
  daysCount: number
  hourRange: [number, number]
  mode: HeatmapMode
  members: Employee[]
  excludedMemberIds: ReadonlySet<string>
  onPrevWeek: () => void
  onNextWeek: () => void
  onToday: () => void
  onDaysChange: (days: number) => void
  onHoursChange: (range: [number, number]) => void
  onModeChange: (mode: HeatmapMode) => void
  onToggleMember: (id: string) => void
  onResetMembers: () => void
}

export function HeatmapControls({
  weekStart,
  daysCount,
  hourRange,
  mode,
  members,
  excludedMemberIds,
  onPrevWeek,
  onNextWeek,
  onToday,
  onDaysChange,
  onHoursChange,
  onModeChange,
  onToggleMember,
  onResetMembers,
}: HeatmapControlsProps) {
  const weekEnd = addDays(weekStart, Math.max(1, daysCount) - 1)
  const todayWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 })
  const isThisWeek = weekStart.getTime() === todayWeekStart.getTime()

  const activeMembersCount = members.length - excludedMemberIds.size

  const [filterOpen, setFilterOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!filterOpen) return
    const handler = (event: MouseEvent) => {
      if (!popoverRef.current) return
      if (!popoverRef.current.contains(event.target as Node)) {
        setFilterOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [filterOpen])

  const handleDaysChange = (value: DaysPreset | '') => {
    if (!value) return
    onDaysChange(Number(value))
  }

  const handleHoursChange = (value: HoursPreset | '') => {
    if (!value) return
    onHoursChange(rangeFromPreset(value))
  }

  return (
    <div className={s.toolbar}>
      <div className={s.weekNav}>
        <button
          type="button"
          className={s.navBtn}
          onClick={onPrevWeek}
          aria-label="Предыдущая неделя"
          title="Предыдущая неделя"
        >
          <AngleRightIcon className={s.prevIcon} />
        </button>
        <span className={s.weekRange}>
          {formatDateRange(weekStart.toISOString(), weekEnd.toISOString())}
        </span>
        <button
          type="button"
          className={cn(s.todayBtn, isThisWeek && s.todayBtnDisabled)}
          onClick={onToday}
          disabled={isThisWeek}
        >
          Сегодня
        </button>
        <button
          type="button"
          className={s.navBtn}
          onClick={onNextWeek}
          aria-label="Следующая неделя"
          title="Следующая неделя"
        >
          <AngleRightIcon />
        </button>
      </div>

      <div className={s.controls}>
        <Select<DaysPreset>
          value={String(daysCount) as DaysPreset}
          onValueChange={handleDaysChange}
          options={DAYS_OPTIONS}
          size="sm"
          aria-label="Количество дней"
        />
        <Select<HoursPreset>
          value={hoursPresetFromRange(hourRange)}
          onValueChange={handleHoursChange}
          options={HOURS_OPTIONS}
          size="sm"
          aria-label="Диапазон часов"
        />

        <div className={s.membersFilter} ref={popoverRef}>
          <button
            type="button"
            className={cn(s.filterBtn, filterOpen && s.filterBtnActive)}
            onClick={() => setFilterOpen((v) => !v)}
          >
            <UserIcon width={14} height={14} />
            <span>
              Сотрудники {activeMembersCount}/{members.length}
            </span>
          </button>
          {filterOpen && (
            <div className={s.popover} role="dialog">
              <div className={s.popoverHead}>
                <span>Включить в карту</span>
                <button
                  type="button"
                  className={s.popoverReset}
                  onClick={onResetMembers}
                  disabled={excludedMemberIds.size === 0}
                >
                  Все
                </button>
              </div>
              <div className={s.memberList}>
                {members.map((emp) => {
                  const excluded = excludedMemberIds.has(emp.id)
                  return (
                    <button
                      key={emp.id}
                      type="button"
                      className={cn(s.memberRow, excluded && s.memberRowExcluded)}
                      onClick={() => onToggleMember(emp.id)}
                    >
                      <Avatar
                        initials={emp.initials}
                        fullName={emp.fullName}
                        colorSeed={emp.id}
                        size="xs"
                      />
                      <span className={s.memberName}>{emp.fullName}</span>
                      <span className={s.memberToggle}>{excluded ? 'выкл.' : 'вкл.'}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className={s.modeToggle} role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'majority'}
            className={cn(s.modeBtn, mode === 'majority' && s.modeBtnActive)}
            onClick={() => onModeChange('majority')}
          >
            Большинство
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'all'}
            className={cn(s.modeBtn, mode === 'all' && s.modeBtnActive)}
            onClick={() => onModeChange('all')}
          >
            Все
          </button>
        </div>
      </div>
    </div>
  )
}
