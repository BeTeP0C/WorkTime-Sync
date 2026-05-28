'use client'

import { useEffect, useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'

import {
  useAnalyticsStore,
  useDashboardStore,
  useEmployeesStore,
  useTeamsStore,
} from '@/app-store/context'
import { DashboardSummaryRaw } from '@/entities/dashboard/model/types'
import { EmployeeRaw, RiskLevel } from '@/entities/employee/model/types'
import { TeamRaw } from '@/entities/team/model/types'
import { ActivityIcon, CalendarXIcon, FireIcon, ShieldCheckIcon } from '@/shared/icons'
import { formatScore } from '@/shared/lib/format'
import { AppHeader } from '@/widgets/AppHeader'
import { EmployeeMetricsTable, EmployeeMetricsTableSkeleton } from '@/widgets/EmployeeMetricsTable'
import { MetricsHeaderControls } from '@/widgets/MetricsHeaderControls'
import { RiskAndDynamicsCard, RiskAndDynamicsCardSkeleton } from '@/widgets/RiskAndDynamicsCard'
import { RiskDistributionHistoryCard } from '@/widgets/RiskDistributionHistoryCard'
import { StatCard, StatCardSkeleton } from '@/widgets/StatCard'
import { TeamRatingCard } from '@/widgets/TeamRatingCard'
import { TeamTimeseriesCard } from '@/widgets/TeamTimeseriesCard'

import s from './MetricsClient.module.scss'

function formatDelta(delta: number, unit: 'score' | 'percent'): string {
  const sign = delta > 0 ? '+' : ''
  if (unit === 'percent') return `${sign}${Math.round(delta * 100)}% к апрелю`
  return `${sign}${formatScore(delta)} к апрелю`
}

interface MetricsClientProps {
  initialSummary: DashboardSummaryRaw | null
  initialEmployees: EmployeeRaw[] | null
  initialTeams: TeamRaw[] | null
}

export const MetricsClient = observer(function MetricsClient({
  initialSummary,
  initialEmployees,
  initialTeams,
}: MetricsClientProps) {
  const dashboard = useDashboardStore()
  const analytics = useAnalyticsStore()
  const employees = useEmployeesStore()
  const teams = useTeamsStore()

  useState(() => {
    // Сбрасываем «лишние» фильтры (риск/формат/поиск), которые могли остаться
    // после /employees. Команду оставит выбор по умолчанию ниже.
    employees.resetFilters()
    if (initialSummary) dashboard.hydrate(initialSummary)
    if (initialEmployees) employees.hydrate(initialEmployees)
    if (initialTeams) teams.hydrate(initialTeams)
    if (!employees.filters.teamId.value && teams.list.items.length > 0) {
      employees.filters.teamId.change(teams.list.items[0].id)
    }
    return true
  })

  useEffect(() => {
    if (!dashboard.loadingStage.isSuccessful) dashboard.fetch()
    if (!analytics.actualityHistoryStage.isSuccessful) analytics.fetchActualityHistory()
    if (!analytics.teamRatingStage.isSuccessful) analytics.fetchTeamRating()
    if (!analytics.riskDistributionHistoryStage.isSuccessful)
      analytics.fetchRiskDistributionHistory()
    if (!teams.list.loadingStage.isSuccessful) {
      teams.fetch().then(() => {
        if (!employees.filters.teamId.value && teams.list.items.length > 0) {
          employees.filters.teamId.change(teams.list.items[0].id)
        }
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // При смене команды через MetricsHeaderControls перезапрашиваем список с бэка
  // и подгружаем timeseries по новой команде (если не загружено ранее).
  const selectedTeamId = employees.filters.teamId.value
  const selectedTeam = selectedTeamId ? teams.getTeam(selectedTeamId) : null
  useEffect(() => {
    employees.fetch()
    if (selectedTeamId) {
      const stage = analytics.getTeamMetricsHistoryStage(selectedTeamId)
      if (!stage?.isSuccessful) analytics.fetchTeamMetricsHistory(selectedTeamId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTeamId])

  const summary = dashboard.summary.value
  const isDashboardLoading = dashboard.loadingStage.isInitial || !summary
  const isTableLoading = employees.list.loadingStage.isInitial

  /** Распределение по риску среди уже загруженных (с учётом серверного фильтра по команде). */
  const filteredRiskDistribution = useMemo<Record<RiskLevel, number>>(() => {
    const result: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0, critical: 0 }
    for (const e of employees.list.items) {
      if (e.metric) result[e.metric.riskLevel] += 1
    }
    return result
  }, [employees.list.items])

  return (
    <>
      <AppHeader title="Расчёт показателей" action={<MetricsHeaderControls />} />

      <div className={s.stats}>
        {isDashboardLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            <StatCard
              className={s.kpiCard}
              showTrendIcon={false}
              icon={<ActivityIcon width={18} height={18} />}
              label="Средний Ai"
              value={formatScore(summary.averageActualityScore)}
              valueColor="#f59e0b"
              trend={{
                value: formatDelta(summary.averageActualityScoreDelta, 'score'),
                tone: summary.averageActualityScoreDelta >= 0 ? 'up' : 'down',
              }}
            />
            <StatCard
              className={s.kpiCard}
              showTrendIcon={false}
              icon={<ShieldCheckIcon width={18} height={18} />}
              label="Средний RI"
              value={formatScore(summary.averageRiskScore)}
              valueColor="#f97316"
              trend={{
                value: formatDelta(summary.averageRiskScoreDelta, 'score'),
                tone: summary.averageRiskScoreDelta > 0 ? 'down' : 'up',
              }}
            />
            <StatCard
              className={s.kpiCard}
              showTrendIcon={false}
              icon={<CalendarXIcon width={18} height={18} />}
              label="Конфликтов CI"
              value={`${Math.round(summary.conflictsRate * 100)}%`}
              valueColor="#ef4444"
              trend={{
                value: formatDelta(summary.conflictsRateDelta, 'percent'),
                tone: summary.conflictsRateDelta > 0 ? 'down' : 'up',
              }}
            />
            <StatCard
              className={s.kpiCard}
              icon={<FireIcon width={18} height={18} />}
              label="Перегруженных"
              value={summary.overloadedEmployeesCount}
              valueColor="#f97316"
              hint={`из ${summary.teamSize} в команде`}
            />
          </>
        )}
      </div>

      <div className={s.grid}>
        {isTableLoading ? <EmployeeMetricsTableSkeleton /> : <EmployeeMetricsTable />}
        {isDashboardLoading ? (
          <RiskAndDynamicsCardSkeleton />
        ) : (
          <RiskAndDynamicsCard
            distribution={filteredRiskDistribution}
            history={analytics.actualityHistory}
          />
        )}
      </div>

      <div className={s.analystGrid}>
        <TeamRatingCard items={analytics.teamRating} />
        <TeamTimeseriesCard
          teamName={selectedTeam?.name ?? ''}
          teamId={selectedTeamId}
          points={analytics.getTeamMetricsHistory(selectedTeamId)}
        />
        <div className={s.analystGridFull}>
          <RiskDistributionHistoryCard points={analytics.riskDistributionHistory} />
        </div>
      </div>
    </>
  )
})
