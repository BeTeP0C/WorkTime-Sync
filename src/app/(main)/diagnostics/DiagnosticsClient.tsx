'use client'

import { useEffect, useMemo } from 'react'
import cn from 'classnames'
import { observer } from 'mobx-react-lite'

import { useEmployeesStore, useTeamsStore } from '@/app-store/context'
import { CATEGORY_LABEL_RU } from '@/app-store/stores/EmployeesStore'
import { RiskLevel } from '@/entities/employee/model/types'
import {
  CalendarIcon,
  ChartTreeIcon,
  ListCheckIcon,
  ShieldExclamationIcon,
  UploadIcon,
} from '@/shared/icons'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { AppHeader } from '@/widgets/AppHeader'
import { DiagnosticsBoard } from '@/widgets/DiagnosticsBoard'
import { RiskDistributionChart } from '@/widgets/RiskDistributionChart'

import s from './DiagnosticsClient.module.scss'

export const DiagnosticsClient = observer(function DiagnosticsClient() {
  const employees = useEmployeesStore()
  const teams = useTeamsStore()

  useEffect(() => {
    employees.fetch()
    teams.fetch()
  }, [employees, teams])

  const categories = employees.byCategory
  const distribution = useMemo<Record<RiskLevel, number>>(() => {
    const result: Record<RiskLevel, number> = { low: 0, medium: 0, high: 0, critical: 0 }
    for (const e of employees.filteredItems) {
      if (e.metric) result[e.metric.riskLevel] += 1
    }
    return result
  }, [employees.filteredItems])

  return (
    <>
      <AppHeader
        title="Диагностика сотрудников"
        action={
          <>
            <Button variant="secondary" size="md" leftIcon={<CalendarIcon />}>
              Май 2026
            </Button>
            <Button variant="primary" size="md" leftIcon={<UploadIcon />}>
              Отправить запросы группе
            </Button>
          </>
        }
      />

      <div className={s.topRow}>
        <div className={s.leftCol}>
          <div className={s.filters}>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<ChartTreeIcon />}
              className={s.filterBtn}
            >
              Все команды
            </Button>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<ShieldExclamationIcon />}
              className={s.filterBtn}
            >
              Все уровни риска
            </Button>
            <Button
              variant="secondary"
              size="md"
              leftIcon={<ListCheckIcon />}
              className={s.filterBtn}
            >
              Все форматы работы
            </Button>
          </div>

          <div className={s.counters}>
            {employees.categoriesOrder.map((cat) => (
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
        categoriesOrder={employees.categoriesOrder}
        attentionReason={(emp) => employees.attentionReason(emp)}
      />
    </>
  )
})
