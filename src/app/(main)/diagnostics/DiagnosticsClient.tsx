'use client'

import { useEffect, useMemo } from 'react'
import cn from 'classnames'
import { observer } from 'mobx-react-lite'

import { useEmployeesStore, useTeamsStore } from '@/app-store/context'
import { CATEGORY_LABEL_RU } from '@/app-store/stores/EmployeesStore'
import {
  RISK_LABEL_RU,
  RiskLevel,
  WORK_FORMAT_LABEL_RU,
  WorkFormat,
} from '@/entities/employee/model/types'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { Select } from '@/shared/ui/Select'
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

  const teamOptions = teams.list.items.map((t) => ({ value: t.id, label: t.name }))
  const riskOptions: { value: RiskLevel; label: string }[] = [
    { value: 'critical', label: RISK_LABEL_RU.critical },
    { value: 'high', label: RISK_LABEL_RU.high },
    { value: 'medium', label: RISK_LABEL_RU.medium },
    { value: 'low', label: RISK_LABEL_RU.low },
  ]
  const formatOptions: { value: WorkFormat; label: string }[] = [
    { value: 'office', label: WORK_FORMAT_LABEL_RU.office },
    { value: 'remote', label: WORK_FORMAT_LABEL_RU.remote },
    { value: 'hybrid', label: WORK_FORMAT_LABEL_RU.hybrid },
  ]

  return (
    <>
      <AppHeader
        title="Диагностика сотрудников"
        action={
          <>
            <Button variant="secondary" size="md">
              📅 Май 2026
            </Button>
            <Button variant="primary" size="md">
              Отправить запросы группе
            </Button>
          </>
        }
      />

      <div className={s.filters}>
        <Select
          value={employees.filters.teamId.value ?? ''}
          onValueChange={(v) => employees.filters.teamId.change(v || null)}
          options={teamOptions}
          placeholder="Все команды"
        />
        <Select<RiskLevel>
          value={employees.filters.riskLevel.value ?? ''}
          onValueChange={(v) => employees.filters.riskLevel.change((v as RiskLevel) || null)}
          options={riskOptions}
          placeholder="Все уровни риска"
        />
        <Select<WorkFormat>
          value={employees.filters.workFormat.value ?? ''}
          onValueChange={(v) => employees.filters.workFormat.change((v as WorkFormat) || null)}
          options={formatOptions}
          placeholder="Все форматы работы"
        />
      </div>

      <div className={s.topRow}>
        <div className={s.counters}>
          {employees.categoriesOrder.map((cat) => (
            <Card key={cat} padding="md" className={cn(s.counter, s[`counter_${cat}`])}>
              <div className={s.counterHead}>
                <span className={cn(s.counterDot, s[`counterDot_${cat}`])} />
                <span className={s.counterLabel}>{CATEGORY_LABEL_RU[cat]}</span>
              </div>
              <div className={s.counterValue}>{categories[cat].length}</div>
            </Card>
          ))}
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
