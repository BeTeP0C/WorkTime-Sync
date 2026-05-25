'use client'

import Link from 'next/link'
import { observer } from 'mobx-react-lite'

import { CATEGORY_LABEL_RU, DiagnosticsCategory } from '@/app-store/stores/EmployeesStore'
import { Employee, RISK_SHORT_LABEL_RU } from '@/entities/employee/model/types'
import { Avatar } from '@/shared/ui/Avatar'
import { Badge, BadgeTone } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { ProgressBar } from '@/shared/ui/ProgressBar'

import s from './DiagnosticsBoard.module.scss'

const CATEGORY_TONE: Record<DiagnosticsCategory, BadgeTone> = {
  actual: 'low',
  outdated: 'critical',
  outside_schedule: 'high',
  overloaded: 'high',
  pending_confirmation: 'info',
}

interface DiagnosticsBoardProps {
  byCategory: Record<DiagnosticsCategory, Employee[]>
  categoriesOrder: DiagnosticsCategory[]
  attentionReason: (emp: Employee) => string
}

export const DiagnosticsBoard = observer(function DiagnosticsBoard({
  byCategory,
  categoriesOrder,
  attentionReason,
}: DiagnosticsBoardProps) {
  return (
    <div className={s.board}>
      {categoriesOrder.map((category) => {
        const list = byCategory[category]
        return (
          <div key={category} className={s.column}>
            <div className={s.columnHeader}>
              <span className={`${s.dot} ${s[`dot_${category}`]}`} />
              <span className={s.columnTitle}>{CATEGORY_LABEL_RU[category]}</span>
              <span className={s.columnCount}>{list.length}</span>
            </div>

            <div className={s.list}>
              {list.length === 0 && <div className={s.empty}>—</div>}
              {list.map((emp) => (
                <EmployeeKanbanCard
                  key={emp.id}
                  emp={emp}
                  category={category}
                  reason={attentionReason(emp)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
})

interface CardProps {
  emp: Employee
  category: DiagnosticsCategory
  reason: string
}

function EmployeeKanbanCard({ emp, category, reason }: CardProps) {
  const m = emp.metric
  if (!m) return null
  const tone = CATEGORY_TONE[category]
  const buttonLabel =
    category === 'outdated' || category === 'outside_schedule'
      ? 'Запросить'
      : category === 'overloaded'
        ? 'Рекомендации'
        : category === 'pending_confirmation'
          ? 'Повторить запрос'
          : 'Профиль'

  const buttonVariant = category === 'actual' ? 'secondary' : 'primary'

  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <Avatar initials={emp.initials} fullName={emp.fullName} colorSeed={emp.id} size="sm" />
        <div className={s.cardInfo}>
          <div className={s.cardName}>{shortName(emp.fullName)}</div>
          <div className={s.cardPosition}>{shortPosition(emp.position)}</div>
        </div>
        <span className={s.score}>{m.actualityScore.toFixed(2)}</span>
      </div>
      <ProgressBar
        value={m.actualityScore}
        tone={
          m.riskLevel === 'critical'
            ? 'critical'
            : m.riskLevel === 'high'
              ? 'high'
              : m.riskLevel === 'medium'
                ? 'medium'
                : 'success'
        }
        size="sm"
        className={s.bar}
      />
      <div className={s.reason}>{reason || labelByCategory(category, emp)}</div>
      <Badge tone={tone} size="sm" className={s.badge}>
        {RISK_SHORT_LABEL_RU[m.riskLevel]}
      </Badge>
      <Link href={`/employees/${emp.id}`} className={s.btnLink}>
        <Button variant={buttonVariant} size="sm" fullWidth>
          {buttonLabel}
        </Button>
      </Link>
    </div>
  )
}

function shortName(fullName: string): string {
  const parts = fullName.split(' ')
  if (parts.length < 2) return fullName
  return `${parts[0][0]}. ${parts[1]}`
}

function shortPosition(p: string): string {
  return p.split('-')[0]
}

function labelByCategory(cat: DiagnosticsCategory, emp: Employee): string {
  const m = emp.metric
  if (!m) return ''
  if (cat === 'actual') return `Обновлено ${m.daysSinceUpdate} дней назад`
  if (cat === 'pending_confirmation') return 'Запрос не получил ответа'
  return ''
}
