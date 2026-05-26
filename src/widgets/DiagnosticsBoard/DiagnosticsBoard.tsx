'use client'

import Link from 'next/link'
import cn from 'classnames'
import { observer } from 'mobx-react-lite'

import { CATEGORY_LABEL_RU, DiagnosticsCategory } from '@/app-store/stores/EmployeesStore'
import { Employee } from '@/entities/employee/model/types'
import { Avatar } from '@/shared/ui/Avatar'
import { Button } from '@/shared/ui/Button'
import { ProgressBar, ProgressTone } from '@/shared/ui/ProgressBar'

import s from './DiagnosticsBoard.module.scss'

const COLUMN_TITLE: Partial<Record<DiagnosticsCategory, string>> = {
  outside_schedule: 'Вне графика',
  pending_confirmation: 'Подтвердить',
}

const CATEGORY_AVATAR_BG: Record<DiagnosticsCategory, string> = {
  actual: '#22c55e',
  outdated: '#ef4444',
  outside_schedule: '#f97316',
  overloaded: '#f59e0b',
  pending_confirmation: '#3b6fe8',
}

const CATEGORY_BAR_TONE: Record<DiagnosticsCategory, ProgressTone> = {
  actual: 'success',
  outdated: 'critical',
  outside_schedule: 'high',
  overloaded: 'medium',
  pending_confirmation: 'primary',
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
          <div key={category} className={cn(s.column, s[`column_${category}`])}>
            <div className={s.columnHeader}>
              <span className={s.columnTitle}>{COLUMN_TITLE[category] ?? CATEGORY_LABEL_RU[category]}</span>
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
  const buttonLabel =
    category === 'outdated'
      ? 'Запросить'
      : category === 'outside_schedule'
        ? 'Конфликты'
        : category === 'overloaded'
          ? 'Рекомендации'
          : category === 'pending_confirmation'
            ? 'Повторить запрос'
            : 'Профиль'

  return (
    <div className={s.card}>
      <div className={s.cardHead}>
        <Avatar
          initials={emp.initials}
          fullName={emp.fullName}
          bg={CATEGORY_AVATAR_BG[category]}
          size="lg"
        />
        <div className={s.cardInfo}>
          <div className={s.cardName}>{shortName(emp.fullName)}</div>
          <div className={s.cardPosition}>{shortPosition(emp.position)}</div>
        </div>
      </div>
      <div className={s.cardBarRow}>
        <ProgressBar
          value={m.actualityScore}
          tone={CATEGORY_BAR_TONE[category]}
          size="md"
          className={s.bar}
        />
        <span className={s.score}>{m.actualityScore.toFixed(2)}</span>
      </div>
      <div className={s.reason}>{reason || labelByCategory(category, emp)}</div>
      <Link href={`/employees/${emp.id}`} className={s.btnLink}>
        <Button size="md" fullWidth className={cn(s.cardBtn, s[`cardBtn_${category}`])}>
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
