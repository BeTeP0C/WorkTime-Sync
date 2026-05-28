'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import cn from 'classnames'
import { observer } from 'mobx-react-lite'

import { useEmployeesStore, useRoadmapStore, useTeamsStore } from '@/app-store/context'
import {
  ROADMAP_SEVERITY_LABEL_RU,
  ROADMAP_SEVERITY_ORDER,
  ROADMAP_STATUS_LABEL_RU,
  RoadmapItem,
  RoadmapSeverity,
  RoadmapStatus,
} from '@/entities/roadmap/model/types'
import {
  AlertIcon,
  CheckSmallIcon,
  DashboardsIcon,
  ListCheckIcon,
  MailIcon,
  UploadSyncIcon,
  XSmallIcon,
} from '@/shared/icons'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { AppHeader } from '@/widgets/AppHeader'
import { RoadmapItemCard } from '@/widgets/RoadmapItemCard'
import { RoadmapItemDrawer } from '@/widgets/RoadmapItemDrawer'
import { RoadmapKanban } from '@/widgets/RoadmapKanban'
import { StatCard } from '@/widgets/StatCard'

import { RoadmapSkeleton } from './skeletons'

import s from './RoadmapClient.module.scss'

type RoadmapView = 'list' | 'kanban'

const STATUS_FILTER_ORDER: RoadmapStatus[] = [
  'pending',
  'requested',
  'acknowledged',
  'updated',
  'deferred',
]

export const RoadmapClient = observer(function RoadmapClient() {
  const store = useRoadmapStore()
  const employeesStore = useEmployeesStore()
  const teamsStore = useTeamsStore()
  const router = useRouter()
  const searchParams = useSearchParams()

  const queryTeamId = searchParams.get('teamId')
  const queryEmployeeId = searchParams.get('employeeId')
  const queryView = (searchParams.get('view') === 'kanban' ? 'kanban' : 'list') as RoadmapView

  const [view, setView] = useState<RoadmapView>(queryView)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // Синхронизация URL → store (фильтры).
  useEffect(() => {
    let dirty = false
    if (store.filterTeamId.value !== queryTeamId) {
      store.filterTeamId.change(queryTeamId)
      dirty = true
    }
    if (queryEmployeeId !== null) {
      store.filterSubjectType.change('employee')
      dirty = true
    }
    if (dirty) void store.fetch()
    else void store.fetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryTeamId, queryEmployeeId])

  // Подтягиваем employees + teams (для названий subject и selector ответственного в drawer).
  useEffect(() => {
    if (!employeesStore.list.loadingStage.isSuccessful) employeesStore.fetch()
    if (!teamsStore.list.loadingStage.isSuccessful) teamsStore.fetch()
  }, [employeesStore, teamsStore])

  const items = store.sortedItems
  const selectedItem = useMemo<RoadmapItem | null>(
    () => (selectedId ? (store.list.getEntity(selectedId) ?? null) : null),
    [selectedId, store.list.items]
  )

  const activeStatuses = store.filterStatuses.value
  const activeSeverities = store.filterSeverities.value

  const updateUrl = (next: { view?: RoadmapView; teamId?: string | null }) => {
    const params = new URLSearchParams(searchParams.toString())
    if (next.view !== undefined) {
      if (next.view === 'list') params.delete('view')
      else params.set('view', next.view)
    }
    if (next.teamId !== undefined) {
      if (next.teamId) params.set('teamId', next.teamId)
      else params.delete('teamId')
    }
    const qs = params.toString()
    router.replace(qs ? `/roadmap?${qs}` : '/roadmap', { scroll: false })
  }

  const handleSetView = (next: RoadmapView) => {
    setView(next)
    updateUrl({ view: next })
  }

  const handleClearTeamFilter = () => {
    store.filterTeamId.change(null)
    updateUrl({ teamId: null })
    void store.fetch()
  }

  const handleGenerate = async () => {
    const result = await store.generate()
    if (!result) return
    // eslint-disable-next-line no-alert
    alert(`Создано: ${result.created}, пропущено: ${result.skipped}`)
  }

  const handleSetStatus = async (item: RoadmapItem, status: RoadmapStatus) => {
    await store.setStatus(item, status)
  }

  const handleDelete = (item: RoadmapItem) => {
    void store.deleteItem(item)
    if (selectedId === item.id) setSelectedId(null)
  }

  const handlePatch = async (
    item: RoadmapItem,
    patch: { notes?: string; dueAt?: string; assignedToId?: string }
  ) => {
    return store.updateItem(item, patch)
  }

  const toggleStatus = (status: RoadmapStatus) => {
    store.toggleStatusFilter(status)
    void store.fetch()
  }

  const toggleSeverity = (severity: RoadmapSeverity) => {
    store.toggleSeverityFilter(severity)
    void store.fetch()
  }

  const teamFilterLabel = useMemo(() => {
    if (!store.filterTeamId.value) return null
    return teamsStore.getTeam(store.filterTeamId.value)?.name ?? store.filterTeamId.value
  }, [store.filterTeamId.value, teamsStore.list.items])

  if (!store.list.loadingStage.isFinished && store.list.items.length === 0) {
    return <RoadmapSkeleton />
  }

  return (
    <>
      <AppHeader
        title="Дорожная карта актуализации"
        action={
          <>
            <div className={s.viewToggle} role="tablist">
              <button
                type="button"
                role="tab"
                aria-selected={view === 'list'}
                className={cn(s.viewBtn, view === 'list' && s.viewBtnActive)}
                onClick={() => handleSetView('list')}
              >
                <ListCheckIcon width={14} height={14} />
                <span>Список</span>
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={view === 'kanban'}
                className={cn(s.viewBtn, view === 'kanban' && s.viewBtnActive)}
                onClick={() => handleSetView('kanban')}
              >
                <DashboardsIcon width={14} height={14} />
                <span>Канбан</span>
              </button>
            </div>
            <Button
              variant="primary"
              size="md"
              leftIcon={<UploadSyncIcon />}
              onClick={handleGenerate}
              disabled={store.generateLoading.isLoading}
            >
              {store.generateLoading.isLoading ? 'Генерация…' : 'Сгенерировать'}
            </Button>
          </>
        }
      />

      <div className={s.stats}>
        <StatCard
          icon={<ListCheckIcon />}
          label="Запланировано"
          value={store.pendingCount}
          tone="warning"
        />
        <StatCard
          icon={<MailIcon />}
          label="Запрос отправлен"
          value={store.requestedCount}
          tone="warning"
        />
        <StatCard
          icon={<AlertIcon />}
          label="Подтверждено"
          value={store.acknowledgedCount}
          tone="success"
        />
        <StatCard
          icon={<CheckSmallIcon />}
          label="Завершено"
          value={store.completedCount}
          tone="success"
        />
      </div>

      {teamFilterLabel && (
        <div className={s.activeFilter}>
          <span>
            Фильтр команды: <strong>{teamFilterLabel}</strong>
          </span>
          <button type="button" className={s.activeFilterClear} onClick={handleClearTeamFilter}>
            <XSmallIcon width={12} height={12} />
            Сбросить
          </button>
        </div>
      )}

      <div className={s.filters}>
        {view === 'list' && (
          <div className={s.chipGroup}>
            <span className={s.chipGroupLabel}>Статус:</span>
            {STATUS_FILTER_ORDER.map((status) => {
              const isActive = activeStatuses.includes(status)
              const count = store.countsByStatus[status]
              return (
                <button
                  key={status}
                  type="button"
                  className={cn(s.chip, isActive && s.chipActive)}
                  onClick={() => toggleStatus(status)}
                >
                  <span>{ROADMAP_STATUS_LABEL_RU[status]}</span>
                  <span className={s.chipCount}>{count}</span>
                </button>
              )
            })}
          </div>
        )}

        <div className={s.chipGroup}>
          <span className={s.chipGroupLabel}>Важность:</span>
          {ROADMAP_SEVERITY_ORDER.map((severity) => {
            const isActive = activeSeverities.includes(severity)
            const count = store.countsBySeverity[severity]
            return (
              <button
                key={severity}
                type="button"
                className={cn(s.chip, isActive && s.chipActive)}
                onClick={() => toggleSeverity(severity)}
              >
                <span>{ROADMAP_SEVERITY_LABEL_RU[severity]}</span>
                <span className={s.chipCount}>{count}</span>
              </button>
            )
          })}
        </div>
      </div>

      {view === 'kanban' ? (
        <RoadmapKanban items={items} onOpen={(item) => setSelectedId(item.id)} />
      ) : (
        <div className={s.content}>
          <div className={s.list}>
            {items.length === 0 ? (
              <Card padding="lg" className={s.empty}>
                <ListCheckIcon className={s.emptyIcon} />
                <span className={s.emptyTitle}>Дорожная карта пуста</span>
                <span className={s.emptyHint}>
                  Нажмите «Сгенерировать», чтобы построить план актуализации.
                </span>
              </Card>
            ) : (
              items.map((item) => (
                <RoadmapItemCard
                  key={item.id}
                  item={item}
                  onSetStatus={handleSetStatus}
                  onDelete={handleDelete}
                  onOpen={(it) => setSelectedId(it.id)}
                />
              ))
            )}
          </div>

          <aside className={s.sidebar}>
            <Card padding="lg" className={s.sidebarCard}>
              <h3 className={s.sidebarTitle}>Что значит каждый статус</h3>
              <ul className={s.legend}>
                <li>
                  <strong>Запланировано</strong> — задача в очереди.
                </li>
                <li>
                  <strong>Запрос отправлен</strong> — сотруднику пришло уведомление.
                </li>
                <li>
                  <strong>Подтверждено</strong> — сотрудник увидел запрос.
                </li>
                <li>
                  <strong>Обновлено</strong> — данные актуализированы.
                </li>
                <li>
                  <strong>Завершено</strong> — задача закрыта.
                </li>
              </ul>
            </Card>
          </aside>
        </div>
      )}

      <RoadmapItemDrawer
        item={selectedItem}
        onClose={() => setSelectedId(null)}
        onSetStatus={handleSetStatus}
        onPatch={handlePatch}
        onDelete={handleDelete}
      />
    </>
  )
})
