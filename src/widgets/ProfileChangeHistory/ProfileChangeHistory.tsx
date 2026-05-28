'use client'

import cn from 'classnames'

import {
  ACTION_LABEL_RU,
  ChangeHistoryEntry,
  ENTITY_LABEL_RU,
} from '@/entities/change-history/model/types'
import { formatDateMonth } from '@/shared/lib/format'
import { Card, CardHeader } from '@/shared/ui/Card'

import s from './ProfileChangeHistory.module.scss'

interface ProfileChangeHistoryProps {
  entries: ChangeHistoryEntry[]
  limit?: number
}

const EMPLOYEE_FIELD_LABEL_RU: Record<string, string> = {
  full_name: 'ФИО',
  email: 'Email',
  position: 'Должность',
  hire_date: 'Дата приёма',
  timezone: 'Часовой пояс',
  work_format: 'Формат работы',
  role: 'Роль',
  vk_user_id: 'VK ID',
}

function formatScalar(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'string') return value
  return JSON.stringify(value)
}

function describeChange(entry: ChangeHistoryEntry): string {
  if (entry.entityType === 'employee') {
    if (entry.action === 'create') return 'Профиль создан'
    const before = entry.before ?? {}
    const after = entry.after ?? {}
    const diffs: string[] = []
    for (const key of Object.keys(after)) {
      if (key === 'id') continue
      const b = (before as Record<string, unknown>)[key]
      const a = (after as Record<string, unknown>)[key]
      if (JSON.stringify(b) !== JSON.stringify(a)) {
        const label = EMPLOYEE_FIELD_LABEL_RU[key] ?? key
        diffs.push(`${label}: ${formatScalar(b)} → ${formatScalar(a)}`)
      }
    }
    return diffs.length > 0 ? diffs.join('; ') : 'Профиль обновлён'
  }

  if (entry.entityType === 'work_schedule') {
    if (entry.action === 'create') return 'Создан новый рабочий график'
    if (entry.action === 'deactivate') return 'График деактивирован'
    return 'График обновлён'
  }

  if (entry.entityType === 'schedule_exception') {
    if (entry.action === 'create') return 'Добавлено исключение в графике'
    if (entry.action === 'delete') return 'Исключение удалено'
    return 'Исключение обновлено'
  }

  return `${ENTITY_LABEL_RU[entry.entityType]} · ${ACTION_LABEL_RU[entry.action]}`
}

export function ProfileChangeHistory({ entries, limit = 3 }: ProfileChangeHistoryProps) {
  const visible = entries.slice(0, limit)

  return (
    <Card padding="lg" className={s.card}>
      <CardHeader title="История изменений" />
      {visible.length === 0 ? (
        <div className={s.empty}>Изменений пока нет</div>
      ) : (
        <ul className={s.list}>
          {visible.map((entry) => (
            <li key={entry.id} className={s.item}>
              <span className={cn(s.marker, s[`marker_${entry.action}`])} />
              <div className={s.body}>
                <div className={s.header}>
                  <span className={s.headerLeft}>
                    {ENTITY_LABEL_RU[entry.entityType]} · {ACTION_LABEL_RU[entry.action]}
                  </span>
                  <span className={s.headerDate}>{formatDateMonth(entry.changedAt)}</span>
                </div>
                <div className={s.description}>{describeChange(entry)}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
