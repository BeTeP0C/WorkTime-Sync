'use client'

import { observer } from 'mobx-react-lite'

import { useEmployeesStore } from '@/app-store/context'
import { Employee, RiskLevel } from '@/entities/employee/model/types'
import { formatScore, pluralizeRu } from '@/shared/lib/format'
import { BookIcon } from '@/shared/icons'
import { Avatar } from '@/shared/ui/Avatar'
import { Badge } from '@/shared/ui/Badge'
import { Card, CardHeader } from '@/shared/ui/Card'
import { ProgressBar, ProgressTone } from '@/shared/ui/ProgressBar'

import s from './EmployeeMetricsTable.module.scss'

const STATUS_LABEL_RU: Record<RiskLevel, string> = {
  critical: 'критический',
  high: 'высокий',
  medium: 'средний',
  low: 'актуален',
}

function aiTone(value: number): ProgressTone {
  if (value >= 0.7) return 'success'
  if (value >= 0.4) return 'high'
  return 'critical'
}

function ciTone(rate: number): ProgressTone {
  if (rate <= 0.15) return 'success'
  if (rate <= 0.35) return 'high'
  return 'critical'
}

function liTone(load: number): ProgressTone {
  if (load <= 0.6) return 'success'
  if (load <= 0.8) return 'high'
  return 'critical'
}

function badgeTone(level: RiskLevel) {
  if (level === 'critical') return 'critical' as const
  if (level === 'high') return 'high' as const
  if (level === 'medium') return 'medium' as const
  return 'success' as const
}

function daysClass(days: number): string {
  if (days > 60) return s.daysCritical
  if (days >= 30) return s.daysHigh
  return s.daysOk
}

interface MetricCellProps {
  value: string
  ratio: number
  tone: ProgressTone
}

function MetricCell({ value, ratio, tone }: MetricCellProps) {
  return (
    <div className={s.metricCell}>
      <div className={s.metricCellInner}>
        <span className={s.metricValue}>{value}</span>
        <ProgressBar value={ratio} tone={tone} size="md" className={s.metricBar} />
      </div>
    </div>
  )
}

function shortName(fullName: string): string {
  const parts = fullName.trim().split(/\s+/)
  if (parts.length < 2) return fullName
  const [first, last] = parts
  return `${first[0]}. ${last}`
}

function rowFromEmployee(emp: Employee) {
  const m = emp.metric
  if (!m) return null
  return (
    <div className={s.row} key={emp.id}>
      <div className={s.colName}>
        <Avatar
          initials={emp.initials}
          fullName={emp.fullName}
          size="sm"
          colorSeed={emp.id}
        />
        <span className={s.name}>{shortName(emp.fullName)}</span>
      </div>
      <MetricCell
        value={formatScore(m.actualityScore)}
        ratio={m.actualityScore}
        tone={aiTone(m.actualityScore)}
      />
      <div className={s.simpleCell}>{Math.round(m.conflictRate * 100)}%</div>
      <MetricCell
        value={formatScore(m.loadLevel)}
        ratio={Math.min(1, m.loadLevel)}
        tone={liTone(m.loadLevel)}
      />
      <div className={s.simpleCell}>{formatScore(m.riskScore)}</div>
      <div className={daysClass(m.daysSinceUpdate)}>
        {m.daysSinceUpdate} {pluralizeRu(m.daysSinceUpdate, ['день', 'дня', 'дней'])}
      </div>
      <div className={s.colStatus}>
        <Badge tone={badgeTone(m.riskLevel)} size="md" pill>
          {STATUS_LABEL_RU[m.riskLevel]}
        </Badge>
      </div>
    </div>
  )
}

export const EmployeeMetricsTable = observer(function EmployeeMetricsTable() {
  const employees = useEmployeesStore()
  const rows = [...employees.filteredItems]
    .filter((e) => e.metric)
    .sort((a, b) => (b.metric?.riskScore ?? 0) - (a.metric?.riskScore ?? 0))

  return (
    <Card padding="lg" className={s.card}>
      <CardHeader title="Все показатели по сотрудникам" icon={<BookIcon width={20} height={20} />} />
      <div className={s.scroll}>
        <div className={s.table}>
          <div className={s.tableHead}>
            <div className={s.colName}>Сотрудник</div>
            <div>Ai — актуальность</div>
            <div>Ci — конфликты</div>
            <div>Li — загрузка</div>
            <div>Ri — риск</div>
            <div>Дней без обновления</div>
            <div className={s.colStatus}>Статус</div>
          </div>
          <div className={s.body}>
            {rows.length === 0 ? (
              <div className={s.empty}>Нет данных — выберите другую команду или загрузите свежие графики.</div>
            ) : (
              rows.map(rowFromEmployee)
            )}
          </div>
        </div>
      </div>
    </Card>
  )
})
