'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import cn from 'classnames'
import { observer } from 'mobx-react-lite'
import { toast } from 'sonner'

import { useEmployeesStore, useTeamsStore } from '@/app-store/context'
import { createConfirmationRequest } from '@/entities/confirmation/api'
import { bulkRequestScheduleConfirmation, EmployeeCategoryFilter } from '@/entities/employee/api'
import {
  Employee,
  EmployeeRaw,
  RISK_LABEL_RU,
  WORK_FORMAT_LABEL_RU,
  WorkFormat,
} from '@/entities/employee/model/types'
import { TeamRaw } from '@/entities/team/model/types'
import { ApiError } from '@/shared/api/client'
import { DownloadIcon, MailIcon, SearchIcon, UserIcon } from '@/shared/icons'
import { exportCsv } from '@/shared/lib/exportCsv'
import { Avatar } from '@/shared/ui/Avatar'
import { Badge, BadgeTone } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Pagination } from '@/shared/ui/Pagination'
import { ProgressBar, ProgressTone } from '@/shared/ui/ProgressBar'
import { Select } from '@/shared/ui/Select'
import { AppHeader } from '@/widgets/AppHeader'

import s from './EmployeesPageClient.module.scss'

interface EmployeesPageClientProps {
  initialEmployees: EmployeeRaw[] | null
  initialTeams: TeamRaw[] | null
}

const WORK_FORMAT_OPTIONS: WorkFormat[] = ['office', 'remote', 'hybrid']
const FILTERS_DEBOUNCE_MS = 300

type QuickFilterKey = 'all' | 'critical' | 'high' | 'actual' | 'in_absence'

interface QuickFilterDef {
  key: QuickFilterKey
  label: string
  tone?: 'critical' | 'high' | 'success' | 'primary'
}

const QUICK_FILTERS: QuickFilterDef[] = [
  { key: 'all', label: 'Все' },
  { key: 'critical', label: 'Критич.', tone: 'critical' },
  { key: 'high', label: 'Высокий', tone: 'high' },
  { key: 'actual', label: 'Актуальны', tone: 'success' },
  { key: 'in_absence', label: 'В отпуске', tone: 'primary' },
]

export const EmployeesPageClient = observer(function EmployeesPageClient({
  initialEmployees: _initialEmployees,
  initialTeams,
}: EmployeesPageClientProps) {
  const employees = useEmployeesStore()
  const teams = useTeamsStore()
  const isFirstRunRef = useRef(true)
  const [bulkSending, setBulkSending] = useState(false)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useState(() => {
    employees.resetFilters()
    employees.pagination.page.change(1)
    if (initialTeams) teams.hydrate(initialTeams)
    // initialEmployees намеренно не используем — таблица пагинирована, SSR-список
    // несовместим с client-side pagination. Counts подъедет через fetchCounts() ниже.
    return true
  })

  useEffect(() => {
    if (!teams.list.loadingStage.isSuccessful) teams.fetch()
    employees.fetchPage()
    employees.fetchCounts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { teamId, riskLevel, workFormat, search, category } = employees.filters
  const { page, pageSize, total } = employees.pagination

  // Debounced refetch при смене фильтров; страница сбрасывается на 1.
  useEffect(() => {
    if (isFirstRunRef.current) {
      isFirstRunRef.current = false
      return
    }
    const handler = setTimeout(() => {
      employees.pagination.page.change(1)
      employees.fetchPage()
    }, FILTERS_DEBOUNCE_MS)
    return () => clearTimeout(handler)
  }, [employees, teamId.value, riskLevel.value, workFormat.value, search.value, category.value])

  const teamsMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of teams.list.items) map.set(t.id, t.name)
    return map
  }, [teams.list.items])

  const teamOptions = useMemo(
    () => teams.list.items.map((t) => ({ value: t.id, label: t.name })),
    [teams.list.items]
  )

  const items = employees.list.items
  const isLoading = employees.list.loadingStage.isLoading
  const isInitial = employees.list.loadingStage.isInitial
  const showFullSkeleton = isInitial && items.length === 0
  const isRefetching = isLoading && items.length > 0
  const hasAnyFilters =
    Boolean(search.value.trim()) ||
    teamId.value !== null ||
    riskLevel.value !== null ||
    workFormat.value !== null ||
    category.value !== null

  // Счётчики quick-chips считаем поверх «полного» списка без фильтров (fetchCounts).
  const counts = useMemo(
    () => computeQuickCounts(employees.countsAll.value),
    [employees.countsAll.value]
  )
  const inAbsenceCount = employees.countsInAbsence.value

  const activeQuickKey = computeActiveQuickKey(riskLevel.value, category.value)

  const handleQuickFilter = (key: QuickFilterKey) => {
    if (key === 'all') {
      riskLevel.change(null)
      category.change(null)
    } else if (key === 'critical' || key === 'high') {
      riskLevel.change(key)
      category.change(null)
    } else {
      riskLevel.change(null)
      category.change(key)
    }
  }

  const handleExport = () => {
    if (items.length === 0) return
    const rows = items.map((emp) => buildCsvRow(emp, teamsMap))
    exportCsv(`employees-${new Date().toISOString().slice(0, 10)}.csv`, rows)
  }

  const handleBulkRequest = async () => {
    const targets = employees.countsAll.value.filter((emp) => isOutdated(emp))
    if (targets.length === 0) {
      toast.info('Сотрудников, требующих обновления, не найдено')
      return
    }
    if (bulkSending) return
    setBulkSending(true)
    try {
      const result = await bulkRequestScheduleConfirmation(targets.map((e) => e.id))
      toast.success(
        result.createdCount > 0
          ? `Отправлено запросов: ${result.createdCount}`
          : 'Новых запросов не создано — у всех уже есть активный'
      )
      employees.fetchPage()
      employees.fetchCounts()
    } catch {
      toast.error('Не удалось отправить запросы')
    } finally {
      setBulkSending(false)
    }
  }

  return (
    <>
      <AppHeader
        title="Сотрудники"
        action={
          <>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={items.length === 0}
            >
              Экспорт
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<MailIcon />}
              onClick={handleBulkRequest}
              disabled={bulkSending}
            >
              Массовый запрос
            </Button>
          </>
        }
      />

      <div className={s.quickChips}>
        {QUICK_FILTERS.map((qf) => {
          const value =
            qf.key === 'all'
              ? counts.all
              : qf.key === 'critical'
                ? counts.critical
                : qf.key === 'high'
                  ? counts.high
                  : qf.key === 'actual'
                    ? counts.actual
                    : inAbsenceCount
          return (
            <button
              key={qf.key}
              type="button"
              className={cn(
                s.quickChip,
                qf.tone && s[`quickChip_${qf.tone}`],
                activeQuickKey === qf.key && s.quickChipActive
              )}
              onClick={() => handleQuickFilter(qf.key)}
            >
              <span className={s.quickChipLabel}>{qf.label}</span>
              <span className={s.quickChipCount}>{value}</span>
            </button>
          )
        })}
      </div>

      <Card padding="md" className={s.toolbar}>
        <Input
          size="md"
          placeholder="Поиск по имени, email или должности"
          leftIcon={<SearchIcon width={16} height={16} />}
          value={search.value}
          onChange={(e) => search.change(e.target.value)}
          fullWidth
          className={s.search}
        />

        <div className={s.filterGroup}>
          <span className={s.filterLabel}>Формат работы</span>
          <div className={s.filterChips}>
            <Chip active={workFormat.value === null} onClick={() => workFormat.change(null)}>
              Все
            </Chip>
            {WORK_FORMAT_OPTIONS.map((wf) => (
              <Chip key={wf} active={workFormat.value === wf} onClick={() => workFormat.change(wf)}>
                {WORK_FORMAT_LABEL_RU[wf]}
              </Chip>
            ))}
          </div>
        </div>
      </Card>

      <Card padding="md" className={cn(s.tableCard, isRefetching && s.tableCardRefetching)}>
        <div className={s.tableHead}>
          <span className={s.tableHeadTitle}>Список сотрудников</span>
          <Select
            value={teamId.value ?? ''}
            onValueChange={(v) => teamId.change(v === '' ? null : v)}
            options={teamOptions}
            placeholder="Все команды"
            size="sm"
          />
        </div>

        <div className={cn(s.row, s.headRow)}>
          <span>Сотрудник</span>
          <span>Команда</span>
          <span>Формат</span>
          <span>ЧП</span>
          <span>Обновлено</span>
          <span>AI</span>
          <span>RI — риск</span>
          <span>Статус</span>
          <span>Действия</span>
        </div>

        {showFullSkeleton && <SkeletonList count={pageSize.value} />}

        {!isLoading && items.length === 0 && (
          <div className={s.empty}>
            <div className={s.emptyIcon}>
              <UserIcon width={22} height={22} />
            </div>
            <div className={s.emptyTitle}>
              {hasAnyFilters ? 'Никто не найден' : 'Список сотрудников пуст'}
            </div>
            <div className={s.emptyHint}>
              {hasAnyFilters
                ? 'Попробуй сбросить фильтры или изменить запрос.'
                : 'Как только сотрудники появятся в системе, они отобразятся здесь.'}
            </div>
          </div>
        )}

        {items.length > 0 && !showFullSkeleton && (
          <div className={s.listWrapper}>
            <div className={cn(s.list, isRefetching && s.listDimmed)} aria-busy={isRefetching}>
              {items.map((emp) => (
                <EmployeeRow key={emp.id} emp={emp} teamsMap={teamsMap} />
              ))}
            </div>
            {isRefetching && (
              <div className={s.refetchOverlay} aria-hidden>
                <span className={s.spinner} />
                <span className={s.refetchText}>Обновляем список…</span>
              </div>
            )}
          </div>
        )}

        <div className={s.paginationRow}>
          <span className={s.paginationInfo}>
            Показано {items.length} из {total.value}
          </span>
          <Pagination
            page={page.value}
            pageSize={pageSize.value}
            total={total.value}
            onPageChange={(p) => {
              page.change(p)
              employees.fetchPage()
              // Скроллим к началу таблицы — иначе после смены страницы
              // пользователь видит пустое место (страница уехала вниз).
              if (typeof window !== 'undefined') {
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }
            }}
          />
        </div>
      </Card>
    </>
  )
})

interface QuickCounts {
  all: number
  critical: number
  high: number
  actual: number
}

function computeQuickCounts(all: Employee[]): QuickCounts {
  const counts: QuickCounts = { all: all.length, critical: 0, high: 0, actual: 0 }
  for (const emp of all) {
    const m = emp.metric
    if (!m) continue
    if (m.riskLevel === 'critical') counts.critical += 1
    if (m.riskLevel === 'high') counts.high += 1
    if (m.riskLevel === 'low' && m.daysSinceUpdate < 60) counts.actual += 1
  }
  return counts
}

function computeActiveQuickKey(
  risk: string | null,
  category: EmployeeCategoryFilter | null
): QuickFilterKey {
  if (risk === 'critical') return 'critical'
  if (risk === 'high') return 'high'
  if (category === 'actual') return 'actual'
  if (category === 'in_absence') return 'in_absence'
  return 'all'
}

function isOutdated(emp: Employee): boolean {
  const m = emp.metric
  if (!m) return false
  return m.daysSinceUpdate >= 60
}

function buildCsvRow(
  emp: Employee,
  teamsMap: Map<string, string>
): Record<string, string | number> {
  const teamNames = emp.teamIds
    .map((id) => teamsMap.get(id))
    .filter((name): name is string => Boolean(name))
    .join(', ')
  const m = emp.metric
  return {
    ФИО: emp.fullName,
    Должность: emp.position,
    Команда: teamNames,
    Формат: WORK_FORMAT_LABEL_RU[emp.workFormat],
    'Часовой пояс': emp.timezoneLabel,
    'Обновлено (дней назад)': m ? m.daysSinceUpdate : '',
    AI: m ? m.actualityScore.toFixed(2) : '',
    RI: m ? m.riskScore.toFixed(2) : '',
    'Уровень риска': m ? RISK_LABEL_RU[m.riskLevel] : '',
  }
}

interface SkeletonListProps {
  count: number
}

function SkeletonList({ count }: SkeletonListProps) {
  return (
    <div className={s.list}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={cn(s.row, s.skeletonRow)} aria-hidden>
          <div className={s.skeletonAvatar} />
          <div className={s.skeletonText} />
          <div className={s.skeletonText} />
          <div className={s.skeletonText} />
          <div className={s.skeletonText} />
          <div className={s.skeletonText} />
          <div className={s.skeletonText} />
          <div className={s.skeletonText} />
          <div className={s.skeletonText} />
        </div>
      ))}
    </div>
  )
}

interface EmployeeRowProps {
  emp: Employee
  teamsMap: Map<string, string>
}

function EmployeeRow({ emp, teamsMap }: EmployeeRowProps) {
  const teamNames = emp.teamIds
    .map((id) => teamsMap.get(id))
    .filter((name): name is string => Boolean(name))
  const m = emp.metric

  return (
    <div className={cn(s.row, s.bodyRow)}>
      <Link href={`/employees/${emp.id}`} className={s.cellEmployee}>
        <Avatar initials={emp.initials} fullName={emp.fullName} colorSeed={emp.id} size="sm" />
        <div className={s.empText}>
          <span className={s.empName}>{emp.fullName}</span>
          {emp.position && <span className={s.empPosition}>{emp.position}</span>}
        </div>
      </Link>
      <span className={s.cellTeams}>
        {teamNames.length > 0 ? (
          <>
            {teamNames[0]}
            {teamNames.length > 1 && <span className={s.cellDim}> +{teamNames.length - 1}</span>}
          </>
        ) : (
          <span className={s.cellDim}>—</span>
        )}
      </span>
      <span className={s.cellFormat}>
        <Badge tone="info" size="sm" pill>
          {WORK_FORMAT_LABEL_RU[emp.workFormat]}
        </Badge>
      </span>
      <span className={s.cellMuted}>{shortTimezone(emp.timezoneLabel || emp.timezone)}</span>
      <span className={cn(s.cellUpdated, m && s[`updated_${updatedBucket(m.daysSinceUpdate)}`])}>
        {m ? `${m.daysSinceUpdate} дн.` : '—'}
      </span>
      <span className={s.cellNum}>{m ? m.actualityScore.toFixed(2) : '—'}</span>
      <span className={s.cellRiBar}>
        {m ? (
          <ProgressBar value={m.riskScore} tone={riskTone(m.riskLevel)} size="md" />
        ) : (
          <span className={s.cellDim}>—</span>
        )}
      </span>
      <span className={s.cellStatus}>
        {m ? (
          <Badge tone={badgeTone(m.riskLevel)} size="sm" pill>
            {statusLabel(m.riskLevel)}
          </Badge>
        ) : (
          <span className={s.cellDim}>нет данных</span>
        )}
      </span>
      <span className={s.cellActions}>
        <RowAction emp={emp} />
      </span>
    </div>
  )
}

function RowAction({ emp }: { emp: Employee }) {
  const [pending, setPending] = useState(false)
  const m = emp.metric
  const level = m?.riskLevel ?? 'low'

  if (level === 'low' || !m) {
    return (
      <Link href={`/employees/${emp.id}`}>
        <Button variant="secondary" size="sm">
          Профиль
        </Button>
      </Link>
    )
  }

  const isCriticalOrHigh = level === 'critical' || level === 'high'
  const label = isCriticalOrHigh ? 'Запросить' : 'Напомнить'
  const reason = isCriticalOrHigh ? 'hr-request' : 'reminder'
  const variant: 'danger' | 'accent' = level === 'critical' ? 'danger' : 'accent'

  const handleClick = async () => {
    if (pending) return
    setPending(true)
    try {
      await createConfirmationRequest(emp.id, reason)
      toast.success('Запрос отправлен')
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        toast.info('Активный запрос уже есть')
      } else {
        toast.error('Не удалось отправить запрос')
      }
    } finally {
      setPending(false)
    }
  }

  return (
    <Button variant={variant} size="sm" onClick={handleClick} disabled={pending}>
      {label}
    </Button>
  )
}

function shortTimezone(label: string): string {
  // "UTC+3 Москва" → "UTC+3"
  return label.split(' ')[0] || label
}

function updatedBucket(days: number): 'fresh' | 'warn' | 'stale' {
  if (days >= 60) return 'stale'
  if (days >= 30) return 'warn'
  return 'fresh'
}

function riskTone(level: string): ProgressTone {
  if (level === 'critical') return 'critical'
  if (level === 'high') return 'high'
  if (level === 'medium') return 'medium'
  return 'success'
}

function badgeTone(level: string): BadgeTone {
  if (level === 'critical') return 'critical'
  if (level === 'high') return 'high'
  if (level === 'medium') return 'medium'
  return 'low'
}

function statusLabel(level: string): string {
  if (level === 'critical') return 'Критич.'
  if (level === 'high') return 'Высокий'
  if (level === 'medium') return 'Средний'
  return 'Актуален'
}

interface ChipProps {
  active: boolean
  children: React.ReactNode
  onClick: () => void
}

function Chip({ active, children, onClick }: ChipProps) {
  return (
    <button type="button" className={cn(s.chip, active && s.chipActive)} onClick={onClick}>
      {children}
    </button>
  )
}
