'use client'

import Link from 'next/link'
import cn from 'classnames'

import {
  getAvailableTransitions,
  ROADMAP_SEVERITY_LABEL_RU,
  ROADMAP_SEVERITY_TONE,
  ROADMAP_STATUS_LABEL_RU,
  ROADMAP_STATUS_TONE,
  RoadmapItem,
  RoadmapStatus,
} from '@/entities/roadmap/model/types'
import { CheckSmallIcon, MailIcon, SnowflakeIcon, UploadSyncIcon, XSmallIcon } from '@/shared/icons'
import { Avatar } from '@/shared/ui/Avatar'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card } from '@/shared/ui/Card'

import s from './RoadmapItemCard.module.scss'

const SUBJECT_BG_BY_SEVERITY: Record<string, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#d97706',
  low: '#0ea5e9',
}

const STATUS_ACTION_LABEL: Partial<Record<RoadmapStatus, string>> = {
  requested: 'Отправить запрос',
  acknowledged: 'Отметить подтверждённым',
  updated: 'Отметить обновлённым',
  completed: 'Завершить',
  deferred: 'Отложить',
  ignored: 'Игнорировать',
  dismissed: 'Снять',
}

const STATUS_ACTION_ICON: Partial<Record<RoadmapStatus, JSX.Element>> = {
  requested: <MailIcon />,
  acknowledged: <CheckSmallIcon />,
  updated: <UploadSyncIcon />,
  completed: <CheckSmallIcon />,
  deferred: <SnowflakeIcon />,
  ignored: <XSmallIcon />,
  dismissed: <XSmallIcon />,
}

const PRIMARY_ACTIONS: RoadmapStatus[] = ['requested', 'acknowledged', 'updated', 'completed']

interface RoadmapItemCardProps {
  item: RoadmapItem
  onSetStatus: (item: RoadmapItem, status: RoadmapStatus) => void
  onDelete?: (item: RoadmapItem) => void
  onOpen?: (item: RoadmapItem) => void
}

function teamInitials(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2)
  return parts.map((p) => p[0]?.toUpperCase() ?? '').join('') || 'КМ'
}

function formatDueDate(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

export function RoadmapItemCard({ item, onSetStatus, onDelete, onOpen }: RoadmapItemCardProps) {
  const isEmployee = item.subjectType === 'employee'
  const subjectName = item.subjectName ?? (isEmployee ? 'Сотрудник' : 'Команда')
  const subjectInitials = (
    subjectName
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || (isEmployee ? '??' : teamInitials(subjectName))
  ).slice(0, 2)
  const subjectHref = isEmployee
    ? item.employeeId
      ? `/employees/${item.employeeId}`
      : null
    : item.teamId
      ? `/teams/${item.teamId}`
      : null

  const avatarBg = SUBJECT_BG_BY_SEVERITY[item.severity] ?? '#64748b'
  const availableTransitions = getAvailableTransitions(item.status)
  const primaryTransitions = availableTransitions.filter((t) => PRIMARY_ACTIONS.includes(t))
  const secondaryTransitions = availableTransitions.filter((t) => !PRIMARY_ACTIONS.includes(t))

  return (
    <Card padding="lg" className={s.card}>
      <div
        className={cn(s.header, onOpen && s.headerClickable)}
        onClick={onOpen ? () => onOpen(item) : undefined}
        role={onOpen ? 'button' : undefined}
        tabIndex={onOpen ? 0 : undefined}
      >
        <div className={s.titleBlock}>
          <h3 className={s.title}>{item.title}</h3>
          <span className={s.priority} title="Приоритет">
            P{Math.round(item.priorityScore)}
          </span>
        </div>
        <div className={s.badges}>
          <Badge tone={ROADMAP_STATUS_TONE[item.status]} size="sm" pill>
            {ROADMAP_STATUS_LABEL_RU[item.status]}
          </Badge>
          <Badge tone={ROADMAP_SEVERITY_TONE[item.severity]} size="sm" pill>
            {ROADMAP_SEVERITY_LABEL_RU[item.severity]}
          </Badge>
        </div>
      </div>

      <div className={s.subject}>
        <Avatar initials={subjectInitials} fullName={subjectName} size="sm" bg={avatarBg} />
        {subjectHref ? (
          <Link href={subjectHref} className={s.subjectLink}>
            <span className={s.subjectName}>{subjectName}</span>
          </Link>
        ) : (
          <span className={s.subjectLink}>
            <span className={s.subjectName}>{subjectName}</span>
          </span>
        )}
        {item.dueAt && (
          <>
            <span className={s.subjectDot}>·</span>
            <span className={s.due}>до {formatDueDate(item.dueAt)}</span>
          </>
        )}
      </div>

      <p className={s.reason}>{item.reason}</p>
      <p className={s.action}>{item.action}</p>

      <div className={s.actions}>
        {primaryTransitions.map((status, idx) => (
          <Button
            key={status}
            variant={idx === 0 ? 'primary' : 'secondary'}
            size="md"
            leftIcon={STATUS_ACTION_ICON[status]}
            onClick={() => onSetStatus(item, status)}
            className={s.actionBtn}
          >
            {STATUS_ACTION_LABEL[status] ?? ROADMAP_STATUS_LABEL_RU[status]}
          </Button>
        ))}
        {secondaryTransitions.map((status) => (
          <Button
            key={status}
            variant="ghost"
            size="md"
            leftIcon={STATUS_ACTION_ICON[status]}
            onClick={() => onSetStatus(item, status)}
            className={cn(s.actionBtn, s.actionBtnGhost)}
          >
            {STATUS_ACTION_LABEL[status] ?? ROADMAP_STATUS_LABEL_RU[status]}
          </Button>
        ))}
        {onDelete && (
          <Button
            variant="ghost"
            size="md"
            leftIcon={<XSmallIcon />}
            onClick={() => onDelete(item)}
            className={cn(s.actionBtn, s.actionBtnGhost)}
          >
            Удалить
          </Button>
        )}
      </div>
    </Card>
  )
}
