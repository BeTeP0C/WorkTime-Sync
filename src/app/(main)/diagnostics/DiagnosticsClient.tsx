'use client'

import { useEffect, useMemo, useState } from 'react'
import cn from 'classnames'
import { endOfWeek, format, startOfWeek } from 'date-fns'
import { ru } from 'date-fns/locale'
import { observer } from 'mobx-react-lite'
import { toast } from 'sonner'

import { useEmployeesStore, useTeamsStore } from '@/app-store/context'
import { CATEGORY_LABEL_RU, DiagnosticsCategory } from '@/app-store/stores/EmployeesStore'
import { bulkRequestScheduleConfirmation } from '@/entities/employee/api'
import { EmployeeRaw, RiskLevel } from '@/entities/employee/model/types'
import { TeamRaw } from '@/entities/team/model/types'
import { CalendarIcon, UploadIcon } from '@/shared/icons'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { AppHeader } from '@/widgets/AppHeader'
import { DiagnosticsBoard } from '@/widgets/DiagnosticsBoard'
import { RiskDistributionChart } from '@/widgets/RiskDistributionChart'

import { DiagnosticsSkeleton } from './skeletons'

import s from './DiagnosticsClient.module.scss'

// §18 ТЗ требует 6 групп диагностики, включая «конфликт часового пояса».
// Порядок: от самой острой проблемы к актуальным.
const DIAGNOSTICS_VISIBLE_CATEGORIES: DiagnosticsCategory[] = [
  'actual',
  'outdated',
  'outside_schedule',
  'overloaded',
  'timezone_conflict',
  'no_response',
]

function formatWeekLabel(weekStart: Date): string {
  const start = startOfWeek(weekStart, { weekStartsOn: 1 })
  const end = endOfWeek(weekStart, { weekStartsOn: 1 })
  const sameMonth = start.getMonth() === end.getMonth()
  const startStr = sameMonth
    ? format(start, 'd', { locale: ru })
    : format(start, 'd MMM', { locale: ru })
  const endStr = format(end, 'd MMM', { locale: ru })
  return `Неделя ${startStr}–${endStr}`
}

interface DiagnosticsClientProps {
  initialEmployees: EmployeeRaw[] | null
  initialTeams: TeamRaw[] | null
}

export const DiagnosticsClient = observer(function DiagnosticsClient({
  initialEmployees,
  initialTeams,
}: DiagnosticsClientProps) {
  const employees = useEmployeesStore()
  const teams = useTeamsStore()
  const [bulkSending, setBulkSending] = useState(false)

  useState(() => {
    // Диагностика всегда работает с полным списком — сбрасываем фильтры,
    // которые мог установить пользователь на /employees или /metrics.
    employees.resetFilters()
    if (initialEmployees) employees.hydrate(initialEmployees)
    if (initialTeams) teams.hydrate(initialTeams)
    return true
  })

  useEffect(() => {
    // Если стор уже содержит данные после /employees с фильтром — перезапрашиваем
    // полный список (фильтры мы уже сбросили выше).
    employees.fetch()
    if (!teams.list.loadingStage.isSuccessful) teams.fetch()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const distribution = useMemo<Record<RiskLevel, number>>(() => {
    const result: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0, critical: 0 }
    for (const e of employees.list.items) {
      if (e.metric) result[e.metric.riskLevel] += 1
    }
    return result
  }, [employees.list.items])

  // Лейбл текущей недели — статичен. Фильтр диагностики по произвольной неделе
  // бэком пока не поддерживается (метрики считаются на фиксированном 14-дневном окне),
  // поэтому переключатель убран до появления API.
  const weekLabel = useMemo(() => formatWeekLabel(startOfWeek(new Date(), { weekStartsOn: 1 })), [])

  if (!employees.list.loadingStage.isFinished) {
    return <DiagnosticsSkeleton />
  }

  const categories = employees.byCategory
  const outdatedIds = categories.outdated.map((emp) => emp.id)

  const handleBulkSend = async () => {
    if (outdatedIds.length === 0 || bulkSending) return
    setBulkSending(true)
    try {
      const result = await bulkRequestScheduleConfirmation(outdatedIds)
      toast.success(
        result.createdCount > 0
          ? `Отправлено запросов: ${result.createdCount}`
          : 'Новых запросов не создано — у всех уже есть активный'
      )
      await employees.fetch()
    } catch {
      toast.error('Не удалось отправить запросы')
    } finally {
      setBulkSending(false)
    }
  }

  return (
    <>
      <AppHeader
        title="Диагностика сотрудников"
        action={
          <>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<CalendarIcon />}
              disabled
              title="Метрики считаются на фиксированном 14-дневном окне"
            >
              {weekLabel}
            </Button>
            <Button
              variant="primary"
              size="md"
              leftIcon={<UploadIcon />}
              onClick={handleBulkSend}
              disabled={bulkSending || outdatedIds.length === 0}
            >
              Отправить запросы группе
            </Button>
          </>
        }
      />

      <div className={s.topRow}>
        <div className={s.leftCol}>
          <div className={s.counters}>
            {DIAGNOSTICS_VISIBLE_CATEGORIES.map((cat) => (
              <Card key={cat} padding="md" className={cn(s.counter, s[`counter_${cat}`])}>
                <span className={cn(s.counterDot, s[`counterDot_${cat}`])} />
                <div className={s.counterText}>
                  <span className={s.counterLabel}>{CATEGORY_LABEL_RU[cat]}</span>
                  <span className={s.counterValue}>{categories[cat].length}</span>
                </div>
              </Card>
            ))}
          </div>
        </div>

        <div className={s.chartCol}>
          <RiskDistributionChart distribution={distribution} />
        </div>
      </div>

      <DiagnosticsBoard
        byCategory={categories}
        categoriesOrder={DIAGNOSTICS_VISIBLE_CATEGORIES}
        attentionReason={(emp) => employees.attentionReason(emp)}
      />
    </>
  )
})
