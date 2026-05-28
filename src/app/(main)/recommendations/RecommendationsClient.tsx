'use client'

import { useEffect, useMemo } from 'react'
import cn from 'classnames'
import { observer } from 'mobx-react-lite'

import {
  useAuthStore,
  useEmployeesStore,
  useRecommendationsStore,
  useTeamsStore,
} from '@/app-store/context'
import {
  CATEGORIES_ORDER,
  CATEGORY_LABEL_RU,
  RecommendationCategory,
} from '@/app-store/stores/RecommendationsStore'
import { isManagementRole } from '@/entities/auth/model/types'
import { Recommendation } from '@/entities/recommendation/model/types'
import {
  AlertIcon,
  ChartTreeIcon,
  CheckSmallIcon,
  FireIcon,
  ListCheckIcon,
  SnowflakeIcon,
} from '@/shared/icons'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { useConfirm } from '@/shared/ui/ConfirmDialog'
import { ProgressBar } from '@/shared/ui/ProgressBar'
import { Select, SelectOption } from '@/shared/ui/Select'
import { AiRiBreakdownCard } from '@/widgets/AiRiBreakdownCard'
import { AppHeader } from '@/widgets/AppHeader'
import { PageLoadError } from '@/widgets/ErrorScreen'
import { RecommendationCard } from '@/widgets/RecommendationCard'
import { RecommendationTypeBreakdown } from '@/widgets/RecommendationTypeBreakdown'
import { RecommendationWeeklyChart } from '@/widgets/RecommendationWeeklyChart'
import { StatCard } from '@/widgets/StatCard'

import { RecommendationsSkeleton } from './skeletons'

import s from './RecommendationsClient.module.scss'

const CHIP_ORDER: (RecommendationCategory | 'all')[] = ['all', ...CATEGORIES_ORDER]

export const RecommendationsClient = observer(function RecommendationsClient() {
  const store = useRecommendationsStore()
  const employees = useEmployeesStore()
  const teams = useTeamsStore()
  const auth = useAuthStore()
  const confirm = useConfirm()

  const currentUser = auth.currentUser.value
  const showSelfBreakdown = currentUser !== null && !isManagementRole(currentUser.role)
  const selfEmployee = showSelfBreakdown ? (employees.list.getEntity(currentUser.id) ?? null) : null

  useEffect(() => {
    // Сотрудник видит только свои рекомендации; HR/менеджмент — все.
    const scopedEmployeeId = showSelfBreakdown ? currentUser?.id : undefined
    store.fetch(scopedEmployeeId)
    employees.resetFilters()
    employees.fetch()
    teams.fetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showSelfBreakdown, currentUser?.id])

  // Фильтр по команде учитывает оба субъекта рекомендации:
  //  team — прямое сравнение subjectId с filterTeamId
  //  employee — через teamIds сотрудника (из employees store)
  // ВАЖНО: хуки до раннего return со skeleton'ом, иначе React ругается
  // «Rendered more hooks than during the previous render».
  const filterTeamId = store.filterTeamId.value
  const items = useMemo(() => {
    const base = store.filteredItems
    if (!filterTeamId) return base
    return base.filter((rec) => {
      if (rec.subjectType === 'team') return rec.subjectId === filterTeamId
      const employee = employees.list.getEntity(rec.subjectId)
      return employee?.teamIds.includes(filterTeamId) ?? false
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.filteredItems, filterTeamId, employees.list.items])

  if (store.list.loadingStage.isError) {
    return (
      <PageLoadError
        description="Не удалось получить список рекомендаций. Попробуйте ещё раз."
        onRetry={() => {
          const scopedEmployeeId = showSelfBreakdown ? currentUser?.id : undefined
          store.fetch(scopedEmployeeId)
        }}
      />
    )
  }

  if (!store.list.loadingStage.isFinished) {
    return <RecommendationsSkeleton />
  }

  const counts = store.countsByCategory
  const activeCategory = store.filterCategory.value
  const monthProgress = store.doneCount / Math.max(store.monthTotal, 1)

  const teamOptions: SelectOption[] = teams.list.items.map((team) => ({
    value: team.id,
    label: team.name,
  }))

  const handleResolve = (rec: Recommendation) => store.setStatus(rec, 'done')
  const handleDefer = (rec: Recommendation) => store.setStatus(rec, 'deferred')
  const handleIgnore = (rec: Recommendation) => store.setStatus(rec, 'ignored')

  const handleBulkResolve = async () => {
    const count = store.countsBySeverity.critical
    if (count === 0) return
    const noun = count === 1 ? 'критическую рекомендацию' : 'критических рекомендаций'
    const ok = await confirm({
      title: 'Выполнить все срочные рекомендации?',
      body: `Будет выполнено ${count} ${noun}. Действие нельзя отменить одним кликом.`,
      confirmLabel: 'Выполнить все',
      danger: true,
    })
    if (!ok) return
    store.bulkResolveCritical()
  }

  return (
    <>
      <AppHeader
        title="Рекомендации"
        action={
          <>
            <Select
              value={filterTeamId ?? ''}
              onValueChange={(value) => store.filterTeamId.change(value || null)}
              options={teamOptions}
              placeholder="Все команды"
              size="md"
              leftIcon={<ChartTreeIcon />}
              className={s.headerBtn}
            />
            <Button
              variant="primary"
              size="md"
              leftIcon={<FireIcon />}
              onClick={handleBulkResolve}
              disabled={store.countsBySeverity.critical === 0}
            >
              Выполнить все срочные
            </Button>
          </>
        }
      />

      <div className={s.stats}>
        <StatCard icon={<AlertIcon />} label="Активных" value={store.activeCount} tone="critical" />
        <StatCard
          icon={<CheckSmallIcon />}
          label="Выполнено"
          value={store.doneCount}
          tone="success"
        />
        <StatCard
          icon={<SnowflakeIcon />}
          label="Отложено"
          value={store.deferredCount}
          tone="warning"
        />
        <Card padding="lg" className={s.progressCard}>
          <div className={s.progressHead}>
            <span className={s.progressLabel}>Прогресс выполнения за май</span>
            <span className={s.progressValue}>
              {store.doneCount} из {store.monthTotal}
            </span>
          </div>
          <ProgressBar value={monthProgress} tone="primary" size="md" className={s.progressBar} />
          <span className={s.progressHint}>+{store.doneThisWeek} выполнено за неделю</span>
        </Card>
      </div>

      <div className={s.chips}>
        {CHIP_ORDER.map((chip) => {
          const isActive = chip === 'all' ? activeCategory === null : activeCategory === chip
          const count = chip === 'all' ? store.activeCount : counts[chip]
          const label = chip === 'all' ? 'Все' : CATEGORY_LABEL_RU[chip]
          return (
            <button
              key={chip}
              type="button"
              className={cn(s.chip, isActive && s.chipActive)}
              onClick={() => store.filterCategory.change(chip === 'all' ? null : chip)}
            >
              <span className={s.chipLabel}>{label}</span>
              <span className={s.chipCount}>{count}</span>
            </button>
          )
        })}
      </div>

      <div className={s.content}>
        <div className={s.list}>
          {items.length === 0 ? (
            <Card padding="lg" className={s.empty}>
              <ListCheckIcon className={s.emptyIcon} />
              <span className={s.emptyTitle}>Активных рекомендаций нет</span>
              <span className={s.emptyHint}>Все важные задачи на этой неделе уже выполнены</span>
            </Card>
          ) : (
            items.map((rec) => (
              <RecommendationCard
                key={`${rec.code}:${rec.subjectType}:${rec.subjectId}`}
                recommendation={rec}
                employee={
                  rec.subjectType === 'employee' ? employees.list.getEntity(rec.subjectId) : null
                }
                team={rec.subjectType === 'team' ? teams.getTeam(rec.subjectId) : null}
                onResolve={handleResolve}
                onDefer={handleDefer}
                onIgnore={handleIgnore}
              />
            ))
          )}
        </div>

        <aside className={s.sidebar}>
          {showSelfBreakdown && selfEmployee?.metric && (
            <AiRiBreakdownCard employeeId={selfEmployee.id} metric={selfEmployee.metric} />
          )}
          <RecommendationTypeBreakdown counts={counts} />
          <RecommendationWeeklyChart />
        </aside>
      </div>
    </>
  )
})
