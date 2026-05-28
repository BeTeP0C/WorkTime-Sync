'use client'

import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { toast } from 'sonner'

import { useDashboardStore, useEmployeesStore } from '@/app-store/context'
import { HrSummaryStore } from '@/app-store/stores/HrSummaryStore'
import { DashboardSummaryRaw } from '@/entities/dashboard/model/types'
import { EmployeeRaw } from '@/entities/employee/model/types'
import { CreateEmployeeModal } from '@/features/create-employee'
import {
  AddressBookIcon,
  CalendarIcon,
  ChatArrowDownIcon,
  CheckSmallIcon,
  DownloadIcon,
  PencilIcon,
  PlaneIcon,
  UserIcon,
} from '@/shared/icons'
import { pluralizeRu } from '@/shared/lib/format'
import { Button } from '@/shared/ui/Button'
import { ActualityStatusTable, ActualityStatusTableSkeleton } from '@/widgets/ActualityStatusTable'
import { AIBanner, AIBannerSkeleton } from '@/widgets/AIBanner'
import { AppHeader } from '@/widgets/AppHeader'
import { HRControlBanner, HRControlBannerSkeleton } from '@/widgets/HRControlBanner'
import { RiskDistributionChart } from '@/widgets/RiskDistributionChart'
import { StatCard, StatCardSkeleton } from '@/widgets/StatCard'
import { WorkFormatBreakdown, WorkFormatBreakdownSkeleton } from '@/widgets/WorkFormatBreakdown'

import s from './HrDashboardClient.module.scss'

interface HrAiBannerProps {
  store: HrSummaryStore
}

const HrAiBanner = observer(function HrAiBanner({ store }: HrAiBannerProps) {
  if (store.loadStage.isInitial) {
    return <AIBannerSkeleton />
  }
  const summary = store.summary.value
  if (!summary) return null
  const firstAction = summary.recommendedActions[0]
  return (
    <AIBanner
      title={summary.summary || 'AI-обзор'}
      description={summary.answer}
      actionLabel={firstAction?.action}
      actionHref={firstAction ? '/diagnostics' : undefined}
    />
  )
})

interface HrDashboardClientProps {
  initialSummary: DashboardSummaryRaw | null
  initialEmployees: EmployeeRaw[] | null
}

export const HrDashboardClient = observer(function HrDashboardClient({
  initialSummary,
  initialEmployees,
}: HrDashboardClientProps) {
  const dashboard = useDashboardStore()
  const employees = useEmployeesStore()

  const [hrSummaryStore] = useState(() => new HrSummaryStore())
  const [isCreateOpen, setIsCreateOpen] = useState(false)

  useState(() => {
    employees.resetFilters()
    if (initialSummary) dashboard.hydrate(initialSummary)
    if (initialEmployees) employees.hydrate(initialEmployees)
    return true
  })

  useEffect(() => {
    if (!dashboard.loadingStage.isSuccessful) dashboard.fetch()
    employees.fetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (hrSummaryStore.loadStage.isNotStarted) {
      void hrSummaryStore.fetch()
    }
  }, [hrSummaryStore])

  const summary = dashboard.summary.value
  const isLoading = dashboard.loadingStage.isInitial || employees.list.loadingStage.isInitial
  const isErrored = dashboard.loadingStage.isError || employees.list.loadingStage.isError

  const handleRetry = (): void => {
    if (dashboard.loadingStage.isError) void dashboard.fetch()
    if (employees.list.loadingStage.isError) void employees.fetch()
  }

  const handleExport = (): void => {
    toast.info('Экспорт отчёта в разработке')
  }

  const handleEmployeeCreated = (): void => {
    toast.success('Сотрудник создан')
    void employees.fetch()
    void dashboard.fetch()
  }

  const outdated = summary?.outdatedSchedulesCount ?? 0
  const totalTeams = summary?.totalTeams ?? 0
  const totalEmployees = summary?.totalEmployees ?? 0
  const actualSchedules = summary?.actualSchedulesCount ?? Math.max(totalEmployees - outdated, 0)
  const actualSchedulesDelta = summary?.actualSchedulesDelta ?? 0
  const vacationsThisMonth = summary?.vacationsThisMonth ?? 0
  const outdatedDelta = summary?.outdatedSchedulesDelta ?? 0

  const hrBannerDescription =
    outdated > 0
      ? `${outdated} ${pluralizeRu(outdated, [
          'сотрудник',
          'сотрудника',
          'сотрудников',
        ])} не обновляли данные более 60 дней. Рекомендуется провести массовую актуализацию до конца месяца. Устаревшие данные влияют на корректность начислений и планирование отпусков.`
      : 'Все графики сотрудников актуальны. Продолжайте мониторинг.'

  const hrBannerTitle = `HR-контроль: ${outdated} ${pluralizeRu(outdated, [
    'сотрудник не обновлял',
    'сотрудника не обновляли',
    'сотрудников не обновляли',
  ])} данные более 60 дней`

  return (
    <>
      <AppHeader
        title="Главная"
        action={
          <>
            <Button
              variant="primary"
              size="md"
              leftIcon={<PencilIcon />}
              onClick={() => setIsCreateOpen(true)}
              aria-label="Добавить сотрудника"
            >
              <span className={s.uploadLabel}>Добавить сотрудника</span>
            </Button>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<DownloadIcon />}
              onClick={handleExport}
              aria-label="Экспорт отчёта"
            >
              <span className={s.uploadLabel}>Экспорт отчёта</span>
            </Button>
          </>
        }
      />

      {isErrored && !isLoading && (
        <div className={s.errorBlock} role="alert">
          <div className={s.errorTitle}>Не удалось загрузить дашборд</div>
          <div className={s.errorText}>
            Проверьте соединение и попробуйте снова. Если ошибка повторится — обратитесь к
            администратору.
          </div>
          <Button variant="primary" size="md" onClick={handleRetry}>
            Повторить
          </Button>
        </div>
      )}

      {isLoading ? (
        <>
          <div className={s.stats}>
            {Array.from({ length: 4 }).map((_, i) => (
              <StatCardSkeleton key={i} />
            ))}
          </div>
          <HRControlBannerSkeleton />
          <AIBannerSkeleton />
          <div className={s.hrGrid}>
            <ActualityStatusTableSkeleton />
            <WorkFormatBreakdownSkeleton />
            <WorkFormatBreakdownSkeleton />
          </div>
        </>
      ) : (
        <>
          <div className={s.stats}>
            <StatCard
              icon={<UserIcon width={18} height={18} />}
              label="Всего сотрудников"
              value={totalEmployees || '—'}
              hint={
                <span className={s.hint}>
                  <AddressBookIcon width={15} height={15} />
                  {`в ${totalTeams} ${pluralizeRu(totalTeams, ['команде', 'командах', 'командах'])}`}
                </span>
              }
            />
            <StatCard
              icon={<CheckSmallIcon width={18} height={18} />}
              label="Актуальных графиков"
              value={actualSchedules || '—'}
              tone="success"
              trend={
                summary
                  ? {
                      value: `+${actualSchedulesDelta} за неделю`,
                      tone: actualSchedulesDelta >= 0 ? 'up' : 'down',
                    }
                  : undefined
              }
            />
            <StatCard
              icon={<PlaneIcon width={18} height={18} />}
              label="Отпусков в мае"
              value={vacationsThisMonth || '—'}
              hint={
                <span className={s.hint}>
                  <CalendarIcon width={15} height={15} />
                  подтверждено
                </span>
              }
            />
            <StatCard
              icon={<ChatArrowDownIcon width={18} height={18} />}
              label="Требуют обновления"
              value={outdated || '—'}
              tone="critical"
              trend={
                summary
                  ? {
                      value: `+${outdatedDelta} за неделю`,
                      tone: outdatedDelta > 0 ? 'down' : 'up',
                    }
                  : undefined
              }
            />
          </div>

          <HRControlBanner
            title={hrBannerTitle}
            description={hrBannerDescription}
            actionLabel="Посмотреть"
            actionHref="/diagnostics?category=outdated"
          />

          <HrAiBanner store={hrSummaryStore} />

          <div className={s.hrGrid}>
            <ActualityStatusTable />
            <RiskDistributionChart
              distribution={
                summary?.employeesByRiskLevel ?? { critical: 0, high: 0, medium: 0, low: 0 }
              }
            />
            <WorkFormatBreakdown />
          </div>
        </>
      )}

      <CreateEmployeeModal
        open={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={handleEmployeeCreated}
      />
    </>
  )
})
