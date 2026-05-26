'use client'

import { useEffect, useRef, useState } from 'react'
import { observer } from 'mobx-react-lite'

import { useEmployeesStore, useTeamsStore } from '@/app-store/context'
import { exportCsv } from '@/shared/lib/exportCsv'
import { formatScore } from '@/shared/lib/format'
import { CalendarIcon, ChartTreeIcon, DownloadIcon } from '@/shared/icons'

import s from './MetricsHeaderControls.module.scss'

const MONTHS_RU = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
]
const MONTHS_SHORT_RU = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек']

interface MonthValue {
  year: number
  month: number // 0-11
}

const STATUS_LABEL_RU: Record<string, string> = {
  critical: 'критический',
  high: 'высокий',
  medium: 'средний',
  low: 'актуален',
}

export const MetricsHeaderControls = observer(function MetricsHeaderControls() {
  const teams = useTeamsStore()
  const employees = useEmployeesStore()
  const now = new Date()
  const [month, setMonth] = useState<MonthValue>({ year: now.getFullYear(), month: now.getMonth() })
  const [teamOpen, setTeamOpen] = useState(false)
  const [monthOpen, setMonthOpen] = useState(false)
  const teamRef = useRef<HTMLDivElement>(null)
  const monthRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (teamRef.current && !teamRef.current.contains(e.target as Node)) setTeamOpen(false)
      if (monthRef.current && !monthRef.current.contains(e.target as Node)) setMonthOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const selectedTeamId = employees.filters.teamId.value
  const selectedTeam = selectedTeamId ? teams.getTeam(selectedTeamId) : null
  const teamLabel = selectedTeam ? selectedTeam.name : 'Все команды'
  const monthLabel = `${MONTHS_RU[month.month]} ${month.year}`

  const handleExport = () => {
    const rows = employees.filteredItems
      .filter((e) => e.metric)
      .map((e) => ({
        Сотрудник: e.fullName ?? '',
        'Ai — актуальность': formatScore(e.metric?.actualityScore ?? 0),
        'Ci — конфликты, %': Math.round((e.metric?.conflictRate ?? 0) * 100),
        'Li — загрузка': formatScore(e.metric?.loadLevel ?? 0),
        'Ri — риск': formatScore(e.metric?.riskScore ?? 0),
        'Дней без обновления': e.metric?.daysSinceUpdate ?? 0,
        Статус: STATUS_LABEL_RU[e.metric?.riskLevel ?? 'low'] ?? '',
      }))
    exportCsv(`worktime-metrics-${month.year}-${String(month.month + 1).padStart(2, '0')}.csv`, rows)
  }

  return (
    <div className={s.root}>
      <div className={s.pillWrap} ref={teamRef}>
        <button
          type="button"
          className={s.pill}
          onClick={() => setTeamOpen((v) => !v)}
          aria-expanded={teamOpen}
        >
          <ChartTreeIcon width={16} height={16} />
          <span className={s.pillLabel}>{teamLabel}</span>
        </button>
        {teamOpen && (
          <div className={s.popover} role="listbox">
            <button
              type="button"
              className={s.popoverItem}
              onClick={() => {
                employees.filters.teamId.change(null)
                setTeamOpen(false)
              }}
            >
              Все команды
            </button>
            {teams.list.items.map((team) => (
              <button
                key={team.id}
                type="button"
                className={s.popoverItem}
                onClick={() => {
                  employees.filters.teamId.change(team.id)
                  setTeamOpen(false)
                }}
              >
                {team.name}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className={s.pillWrap} ref={monthRef}>
        <button
          type="button"
          className={s.pill}
          onClick={() => setMonthOpen((v) => !v)}
          aria-expanded={monthOpen}
        >
          <CalendarIcon width={16} height={16} />
          <span className={s.pillLabel}>{monthLabel}</span>
        </button>
        {monthOpen && (
          <div className={s.popover}>
            {MONTHS_SHORT_RU.map((label, idx) => (
              <button
                key={idx}
                type="button"
                className={s.popoverItem}
                onClick={() => {
                  setMonth({ year: now.getFullYear(), month: idx })
                  setMonthOpen(false)
                }}
              >
                {label} {now.getFullYear()}
              </button>
            ))}
          </div>
        )}
      </div>

      <button type="button" className={s.exportPill} onClick={handleExport}>
        <DownloadIcon width={16} height={16} />
        <span className={s.pillLabel}>Экспорт отчёта</span>
      </button>
    </div>
  )
})
