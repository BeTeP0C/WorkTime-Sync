'use client'

import {
  ROADMAP_SEVERITY_LABEL_RU,
  ROADMAP_SEVERITY_TONE,
  RoadmapItem,
} from '@/entities/roadmap/model/types'
import { Avatar } from '@/shared/ui/Avatar'
import { Badge } from '@/shared/ui/Badge'

import s from './RoadmapKanbanCard.module.scss'

const SUBJECT_BG_BY_SEVERITY: Record<string, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#d97706',
  low: '#0ea5e9',
}

function subjectInitials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('') || '??'
  ).slice(0, 2)
}

function formatDue(iso: string | null): string | null {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

interface RoadmapKanbanCardProps {
  item: RoadmapItem
  onOpen: (item: RoadmapItem) => void
}

export function RoadmapKanbanCard({ item, onOpen }: RoadmapKanbanCardProps) {
  const isEmployee = item.subjectType === 'employee'
  const subjectName = item.subjectName ?? (isEmployee ? 'Сотрудник' : 'Команда')
  const due = formatDue(item.dueAt)
  const overdue = item.dueAt ? new Date(item.dueAt).getTime() < Date.now() : false

  return (
    <button type="button" className={s.card} onClick={() => onOpen(item)}>
      <div className={s.head}>
        <Badge tone={ROADMAP_SEVERITY_TONE[item.severity]} size="sm" pill>
          {ROADMAP_SEVERITY_LABEL_RU[item.severity]}
        </Badge>
        <span className={s.priority} title="Приоритет">
          P{Math.round(item.priorityScore)}
        </span>
      </div>

      <div className={s.title}>{item.title}</div>

      <div className={s.subject}>
        <Avatar
          initials={subjectInitials(subjectName)}
          fullName={subjectName}
          src={item.subjectAvatarUrl}
          colorSeed={item.subjectId}
          shape={isEmployee ? 'round' : 'squircle'}
          size="xs"
          bg={item.subjectAvatarUrl ? undefined : SUBJECT_BG_BY_SEVERITY[item.severity]}
        />
        <span className={s.subjectName}>{subjectName}</span>
      </div>

      {due && (
        <div className={overdue ? s.dueOverdue : s.due} title={item.dueAt ?? ''}>
          {overdue ? 'Просрочено: ' : 'до '}
          {due}
        </div>
      )}
    </button>
  )
}
