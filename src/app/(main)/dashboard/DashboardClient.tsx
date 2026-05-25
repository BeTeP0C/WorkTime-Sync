'use client'

import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'

import { useDashboardStore, useEmployeesStore } from '@/app-store/context'
import { formatScore, pluralizeRu } from '@/shared/lib/format'
import { Button } from '@/shared/ui/Button'
import { AIBanner } from '@/widgets/AIBanner'
import { AppHeader } from '@/widgets/AppHeader'
import { AttentionList } from '@/widgets/AttentionList'
import { DataUploader } from '@/widgets/DataUploader'
import { StatCard } from '@/widgets/StatCard'

import s from './DashboardClient.module.scss'

const ICONS = {
  people: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="6" r="3" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M3 16a6 6 0 0 1 12 0"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  ),
  chart: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M3 14V8m4 6V5m4 9v-3m4 3V3"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  ),
  scale: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M9 2v14M3 6l6-4 6 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  ),
  warning: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="9" cy="9" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      <path d="M9 5v4M9 12.5v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  ),
}

export const DashboardClient = observer(function DashboardClient() {
  const dashboard = useDashboardStore()
  const employees = useEmployeesStore()

  useEffect(() => {
    dashboard.fetch()
    employees.fetch()
  }, [dashboard, employees])

  const summary = dashboard.summary.value
  const criticalCount =
    (summary?.employeesByRiskLevel.critical ?? 0) + (summary?.employeesByRiskLevel.high ?? 0)

  return (
    <>
      <AppHeader
        title="Главная"
        action={
          <>
            <Button variant="ghost" size="md" aria-label="Уведомления">
              🔔
            </Button>
            <Button variant="primary" size="md">
              Загрузить данные
            </Button>
          </>
        }
      />

      {summary && criticalCount > 0 && (
        <AIBanner
          title={`AI обнаружил ${criticalCount} ${pluralizeRu(criticalCount, ['сотрудника', 'сотрудников', 'сотрудников'])} с критическим риском неактуальности`}
          description="Рекомендуется отправить запросы на обновление до конца недели. Устаревшие данные влияют на 3 запланированные встречи."
          actionLabel="Посмотреть"
          actionHref="/diagnostics"
        />
      )}

      <div className={s.stats}>
        <StatCard
          icon={ICONS.people}
          label="Всего сотрудников"
          value={summary?.totalEmployees ?? '—'}
          hint={`в ${summary?.totalTeams ?? 0} ${pluralizeRu(summary?.totalTeams ?? 0, ['команде', 'командах', 'командах'])}`}
        />
        <StatCard
          icon={ICONS.chart}
          label="Устаревших графиков"
          value={summary?.outdatedSchedulesCount ?? '—'}
          tone="critical"
          trend={
            summary
              ? {
                  value: `+${summary.outdatedSchedulesDelta} за неделю`,
                  tone: summary.outdatedSchedulesDelta > 0 ? 'down' : 'up',
                }
              : undefined
          }
        />
        <StatCard
          icon={ICONS.scale}
          label="Средний показатель Ai"
          value={summary ? formatScore(summary.averageActualityScore) : '—'}
          tone="warning"
          trend={
            summary
              ? {
                  value: `+${formatScore(summary.averageActualityScoreDelta)} к прошлому мес.`,
                  tone: summary.averageActualityScoreDelta > 0 ? 'up' : 'down',
                }
              : undefined
          }
        />
        <StatCard
          icon={ICONS.warning}
          label="Конфликтов"
          value={summary?.conflictsTotal ?? '—'}
          tone="critical"
          trend={
            summary
              ? {
                  value: `+${summary.conflictsDelta} за неделю`,
                  tone: summary.conflictsDelta > 0 ? 'down' : 'up',
                }
              : undefined
          }
        />
      </div>

      <div className={s.grid}>
        <DataUploader />
        <AttentionList />
      </div>
    </>
  )
})
