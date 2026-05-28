'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'

import { useConflictsStore, useEmployeesStore, useTeamsStore } from '@/app-store/context'
import { ConflictEvent } from '@/entities/conflict/model/types'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { AppHeader } from '@/widgets/AppHeader'
import { ConflictDrawer } from '@/widgets/ConflictDrawer'
import { ConflictsFilterBar } from '@/widgets/ConflictsFilterBar'

import s from './ConflictsPageClient.module.scss'

const PAGE_SIZE = 50

function formatDateTime(iso: string, timezone: string): string {
  const date = new Date(iso)
  return date.toLocaleString('ru-RU', {
    timeZone: timezone,
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(startIso: string, endIso: string): string {
  const minutes = Math.max(
    Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60_000),
    0
  )
  if (minutes < 60) return `${minutes} мин`
  const hours = Math.floor(minutes / 60)
  const rest = minutes % 60
  return rest === 0 ? `${hours} ч` : `${hours} ч ${rest} мин`
}

function getInitials(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')
}

export const ConflictsPageClient = observer(function ConflictsPageClient() {
  const conflicts = useConflictsStore()
  const employees = useEmployeesStore()
  const teams = useTeamsStore()

  useEffect(() => {
    void conflicts.fetch()
    void teams.fetch()
    void employees.fetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const items = conflicts.items.value
  const total = conflicts.total.value
  const offset = conflicts.pagination.offset.value
  const isLoading = conflicts.loadingStage.isLoading
  const canPrev = offset > 0
  const canNext = offset + PAGE_SIZE < total

  const handleOpen = (event: ConflictEvent) => {
    void conflicts.openDrawer(event)
  }

  const handleApplyFilters = () => {
    conflicts.setOffset(0)
    void conflicts.fetch()
  }

  const handleReset = () => {
    conflicts.resetFilters()
    void conflicts.fetch()
  }

  const handlePrev = () => {
    conflicts.setOffset(Math.max(offset - PAGE_SIZE, 0))
    void conflicts.fetch()
  }

  const handleNext = () => {
    conflicts.setOffset(offset + PAGE_SIZE)
    void conflicts.fetch()
  }

  return (
    <div className={s.root}>
      <AppHeader title="Конфликты" />

      <div className={s.summary}>
        <span>
          Найдено: <span className={s.summaryStrong}>{total}</span> событий вне рабочего графика
        </span>
        {isLoading && <span>· обновляем…</span>}
      </div>

      <ConflictsFilterBar onApply={handleApplyFilters} onReset={handleReset} />

      <div className={s.tableWrap}>
        {items.length === 0 ? (
          <div className={s.emptyState}>
            {isLoading
              ? 'Загружаем конфликты…'
              : 'Нет конфликтов за выбранный период. Попробуйте расширить диапазон.'}
          </div>
        ) : (
          <table className={s.table}>
            <thead>
              <tr>
                <th className={s.th}>Дата/время</th>
                <th className={s.th}>Сотрудник</th>
                <th className={s.th}>Команда</th>
                <th className={s.th}>Событие</th>
                <th className={s.th}>Источник</th>
                <th className={s.th} />
              </tr>
            </thead>
            <tbody>
              {items.map((event) => (
                <tr key={event.id} className={s.tr}>
                  <td className={`${s.td} ${s.timeCell}`}>
                    <div className={s.timeMain}>
                      {formatDateTime(event.startDt, event.timezone)}
                    </div>
                    <div className={s.timeSub}>
                      {formatDuration(event.startDt, event.endDt)} · {event.timezone}
                    </div>
                  </td>
                  <td className={s.td}>
                    <div className={s.employeeCell}>
                      <Avatar
                        initials={getInitials(event.employeeFullName)}
                        size="sm"
                        colorSeed={event.employeeId}
                      />
                      <Link href={`/employees/${event.employeeId}`} className={s.employeeLink}>
                        {event.employeeFullName}
                      </Link>
                    </div>
                  </td>
                  <td className={s.td}>{event.teamName ?? '—'}</td>
                  <td className={`${s.td} ${s.eventTitle}`}>{event.title}</td>
                  <td className={s.td}>
                    <span className={s.sourceBadge}>{event.source}</span>
                  </td>
                  <td className={`${s.td} ${s.actionCell}`}>
                    <Button variant="secondary" size="sm" onClick={() => handleOpen(event)}>
                      Разобрать
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {items.length > 0 && (
          <div className={s.pagination}>
            <span>
              {offset + 1}–{Math.min(offset + items.length, total)} из {total}
            </span>
            <div className={s.paginationButtons}>
              <Button variant="secondary" size="sm" disabled={!canPrev} onClick={handlePrev}>
                ← Назад
              </Button>
              <Button variant="secondary" size="sm" disabled={!canNext} onClick={handleNext}>
                Вперёд →
              </Button>
            </div>
          </div>
        )}
      </div>

      <ConflictDrawer />
    </div>
  )
})
