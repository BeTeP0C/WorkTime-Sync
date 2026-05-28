'use client'

import Link from 'next/link'
import { useState } from 'react'
import cn from 'classnames'

import { Employee } from '@/entities/employee/model/types'
import {
  Recommendation,
  RecommendationSeverity,
  SEVERITY_LABEL_RU,
} from '@/entities/recommendation/model/types'
import { Team } from '@/entities/team/model/types'
import { MailIcon, SnowflakeIcon, XSmallIcon } from '@/shared/icons'
import { Avatar } from '@/shared/ui/Avatar'
import { Badge, BadgeTone } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'
import { AiRiBreakdownCard } from '@/widgets/AiRiBreakdownCard'

import s from './RecommendationCard.module.scss'

const SEVERITY_TONE: Record<RecommendationSeverity, BadgeTone> = {
  critical: 'critical',
  high: 'high',
  medium: 'medium',
}

const SUBJECT_BG_BY_SEVERITY: Record<RecommendationSeverity, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#d97706',
}

interface RecommendationCardProps {
  recommendation: Recommendation
  employee: Employee | null
  team: Team | null
  onResolve: (rec: Recommendation) => void
  onDefer: (rec: Recommendation) => void
  onIgnore: (rec: Recommendation) => void
}

function teamInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'КМ'
}

export function RecommendationCard({
  recommendation,
  employee,
  team,
  onResolve,
  onDefer,
  onIgnore,
}: RecommendationCardProps) {
  const [explainOpen, setExplainOpen] = useState(false)
  const isEmployee = recommendation.subjectType === 'employee'
  const canExplain = isEmployee && Boolean(employee?.metric)

  const subjectInitials = isEmployee
    ? (employee?.initials ?? '??')
    : team
      ? teamInitials(team.name)
      : '??'

  const subjectName = isEmployee
    ? (employee?.fullName ?? 'Сотрудник не найден')
    : (team?.name ?? 'Команда не найдена')

  const subjectRole = isEmployee
    ? employee?.position || 'Сотрудник'
    : `${team?.members.length ?? 0} участников`

  const subjectHref = isEmployee
    ? employee
      ? `/employees/${employee.id}`
      : null
    : team
      ? `/teams/${team.id}`
      : null

  const avatarBg = SUBJECT_BG_BY_SEVERITY[recommendation.severity]

  const showIgnore = recommendation.severity !== 'critical'

  return (
    <Card padding="lg" className={s.card}>
      <div className={s.header}>
        <h3 className={s.title}>{recommendation.title}</h3>
        <Badge tone={SEVERITY_TONE[recommendation.severity]} size="md" pill className={s.severity}>
          {SEVERITY_LABEL_RU[recommendation.severity].toLowerCase()}
        </Badge>
      </div>

      <div className={s.subject}>
        <Avatar initials={subjectInitials} fullName={subjectName} size="sm" bg={avatarBg} />
        {subjectHref ? (
          <Link href={subjectHref} className={s.subjectLink}>
            <span className={s.subjectName}>{subjectName}</span>
            <span className={s.subjectDot}>·</span>
            <span className={s.subjectRole}>{subjectRole}</span>
          </Link>
        ) : (
          <span className={s.subjectLink}>
            <span className={s.subjectName}>{subjectName}</span>
            <span className={s.subjectDot}>·</span>
            <span className={s.subjectRole}>{subjectRole}</span>
          </span>
        )}
      </div>

      <p className={s.reason}>{recommendation.reason}</p>

      {canExplain && (
        <button
          type="button"
          className={cn(s.explainToggle, explainOpen && s.explainToggleOpen)}
          onClick={() => setExplainOpen((v) => !v)}
          aria-expanded={explainOpen}
        >
          <span className={s.explainCaret}>{explainOpen ? '▾' : '▸'}</span>
          {explainOpen ? 'Скрыть объяснение' : 'Почему?'}
        </button>
      )}

      {explainOpen && employee?.metric && (
        <div className={s.explainBody}>
          <AiRiBreakdownCard employeeId={employee.id} metric={employee.metric} />
        </div>
      )}

      <div className={s.actions}>
        <Button
          variant="primary"
          size="md"
          leftIcon={<MailIcon />}
          onClick={() => onResolve(recommendation)}
          className={s.actionBtn}
        >
          Отправить запрос
        </Button>
        <Button
          variant="secondary"
          size="md"
          leftIcon={<SnowflakeIcon />}
          onClick={() => onDefer(recommendation)}
          className={cn(s.actionBtn, s.actionBtnGhost)}
        >
          Отложить
        </Button>
        {showIgnore && (
          <Button
            variant="ghost"
            size="md"
            leftIcon={<XSmallIcon />}
            onClick={() => onIgnore(recommendation)}
            className={cn(s.actionBtn, s.actionBtnGhost)}
          >
            Игнорировать
          </Button>
        )}
      </div>
    </Card>
  )
}
