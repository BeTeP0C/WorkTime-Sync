'use client'

import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'

import { useDashboardStore, useEmployeesStore, useTeamsStore } from '@/app-store/context'
import { formatScore } from '@/shared/lib/format'
import {
  ActivityIcon,
  CalendarXIcon,
  FireIcon,
  ShieldCheckIcon,
} from '@/shared/icons'
import { AppHeader } from '@/widgets/AppHeader'
import { EmployeeMetricsTable } from '@/widgets/EmployeeMetricsTable'
import { MetricsHeaderControls } from '@/widgets/MetricsHeaderControls'
import { RiskAndDynamicsCard } from '@/widgets/RiskAndDynamicsCard'
import { StatCard } from '@/widgets/StatCard'

import s from './MetricsClient.module.scss'

function formatDelta(delta: number, unit: 'score' | 'percent'): string {
  const sign = delta > 0 ? '+' : ''
  if (unit === 'percent') return `${sign}${Math.round(delta * 100)}% к апрелю`
  return `${sign}${formatScore(delta)} к апрелю`
}

export const MetricsClient = observer(function MetricsClient() {
  const dashboard = useDashboardStore()
  const employees = useEmployeesStore()
  const teams = useTeamsStore()

  useEffect(() => {
    dashboard.fetch()
    employees.fetch()
    teams.fetch().then(() => {
      if (!employees.filters.teamId.value && teams.list.items.length > 0) {
        employees.filters.teamId.change(teams.list.items[0].id)
      }
    })
  }, [dashboard, employees, teams])

  const summary = dashboard.summary.value

  return (
    <>
      <AppHeader title="Расчёт показателей" action={<MetricsHeaderControls />} />

      <div className={s.stats}>
        <StatCard
          className={s.kpiCard}
          showTrendIcon={false}
          icon={<ActivityIcon width={18} height={18} />}
          label="Средний Ai"
          value={summary ? formatScore(summary.averageActualityScore) : '—'}
          valueColor="#f59e0b"
          trend={
            summary
              ? {
                  value: formatDelta(summary.averageActualityScoreDelta, 'score'),
                  tone: summary.averageActualityScoreDelta >= 0 ? 'up' : 'down',
                }
              : undefined
          }
        />
        <StatCard
          className={s.kpiCard}
          showTrendIcon={false}
          icon={<ShieldCheckIcon width={18} height={18} />}
          label="Средний RI"
          value={summary ? formatScore(summary.averageRiskScore) : '—'}
          valueColor="#f97316"
          trend={
            summary
              ? {
                  value: formatDelta(summary.averageRiskScoreDelta, 'score'),
                  tone: summary.averageRiskScoreDelta > 0 ? 'down' : 'up',
                }
              : undefined
          }
        />
        <StatCard
          className={s.kpiCard}
          showTrendIcon={false}
          icon={<CalendarXIcon width={18} height={18} />}
          label="Конфликтов CI"
          value={summary ? `${Math.round(summary.conflictsRate * 100)}%` : '—'}
          valueColor="#ef4444"
          trend={
            summary
              ? {
                  value: formatDelta(summary.conflictsRateDelta, 'percent'),
                  tone: summary.conflictsRateDelta > 0 ? 'down' : 'up',
                }
              : undefined
          }
        />
        <StatCard
          className={s.kpiCard}
          icon={<FireIcon width={18} height={18} />}
          label="Перегруженных"
          value={summary?.overloadedEmployeesCount ?? '—'}
          valueColor="#f97316"
          hint={summary ? `из ${summary.teamSize} в команде` : undefined}
        />
      </div>

      <div className={s.grid}>
        <EmployeeMetricsTable />
        {summary && (
          <RiskAndDynamicsCard
            distribution={summary.employeesByRiskLevel}
            history={summary.averageActualityScoreHistory}
          />
        )}
      </div>
    </>
  )
})
