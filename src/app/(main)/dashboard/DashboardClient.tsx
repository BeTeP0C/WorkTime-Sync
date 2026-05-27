'use client'

import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'

import { useDashboardStore, useEmployeesStore } from '@/app-store/context'
import { formatScore, pluralizeRu } from '@/shared/lib/format'
import {
  AddressBookIcon,
  BellIcon,
  ChatArrowDownIcon,
  DashboardsIcon,
  InfoIcon,
  UploadIcon,
  UserIcon,
} from '@/shared/icons'
import { Button } from '@/shared/ui/Button'
import { AIBanner, AIBannerSkeleton } from '@/widgets/AIBanner'
import { AppHeader } from '@/widgets/AppHeader'
import { AttentionList, AttentionListSkeleton } from '@/widgets/AttentionList'
import { DataUploader, DataUploaderSkeleton } from '@/widgets/DataUploader'
import { StatCard, StatCardSkeleton } from '@/widgets/StatCard'

import s from './DashboardClient.module.scss'


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

  const isLoading = dashboard.loadingStage.isInitial || employees.list.loadingStage.isInitial

  return (
    <>
      <AppHeader
        title="Главная"
        action={
          <>
            <button type="button" className={s.bell} aria-label="Уведомления">
              <BellIcon width={24} height={25} />
              <span className={s.bellDot} aria-hidden />
            </button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<UploadIcon />}
              aria-label="Загрузить данные"
            >
              <span className={s.uploadLabel}>Загрузить данные</span>
            </Button>
          </>
        }
      />

      {isLoading ? (
        <>
          <AIBannerSkeleton />

          <div className={s.stats}>
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>

          <div className={s.grid}>
            <DataUploaderSkeleton />
            <AttentionListSkeleton />
          </div>
        </>
      ) : (
        <>
          {summary && criticalCount > 0 && (
            <AIBanner
              title={`AI обнаружил ${criticalCount} ${pluralizeRu(criticalCount, ['сотрудник', 'сотрудника', 'сотрудников'])} с критическим риском неактуальности`}
              description="Рекомендуется отправить запросы на обновление до конца недели. Устаревшие данные влияют на 3 запланированные встречи."
              actionLabel="Посмотреть"
              actionHref="/diagnostics"
            />
          )}

          <div className={s.stats}>
            <StatCard
              icon={<UserIcon width={18} height={18} />}
              label="Всего сотрудников"
              value={summary?.totalEmployees ?? '—'}
              hint={
                <span className={s.hint}>
                  <AddressBookIcon width={15} height={15} />
                  {`в ${summary?.totalTeams ?? 0} ${pluralizeRu(summary?.totalTeams ?? 0, ['команде', 'командах', 'командах'])}`}
                </span>
              }
            />
            <StatCard
              icon={<ChatArrowDownIcon width={18} height={18} />}
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
              icon={<DashboardsIcon width={18} height={18} />}
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
              icon={<InfoIcon width={18} height={18} />}
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
      )}
    </>
  )
})
