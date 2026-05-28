'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

import { useEmployeesStore } from '@/app-store/context'
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
import { Select, SelectOption } from '@/shared/ui/Select'

import s from './RoadmapItemDrawer.module.scss'

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

function isoToDateInput(iso: string | null): string {
  if (!iso) return ''
  return iso.slice(0, 10)
}

function dateInputToIso(value: string): string | undefined {
  if (!value) return undefined
  // отправляем дату как ISO с полночью UTC
  return new Date(`${value}T00:00:00.000Z`).toISOString()
}

interface RoadmapItemDrawerProps {
  item: RoadmapItem | null
  onClose: () => void
  onSetStatus: (item: RoadmapItem, status: RoadmapStatus) => Promise<void> | void
  onPatch: (
    item: RoadmapItem,
    patch: { notes?: string; dueAt?: string; assignedToId?: string }
  ) => Promise<RoadmapItem | null>
  onDelete: (item: RoadmapItem) => void
}

export function RoadmapItemDrawer({
  item,
  onClose,
  onSetStatus,
  onPatch,
  onDelete,
}: RoadmapItemDrawerProps) {
  const employeesStore = useEmployeesStore()
  const [notes, setNotes] = useState('')
  const [dueAt, setDueAt] = useState('')
  const [assignedToId, setAssignedToId] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [showSnapshot, setShowSnapshot] = useState(false)

  useEffect(() => {
    if (!item) return
    setNotes(item.notes ?? '')
    setDueAt(isoToDateInput(item.dueAt))
    setAssignedToId(item.assignedToId ?? '')
    setShowSnapshot(false)
  }, [item])

  useEffect(() => {
    if (!item) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [item, onClose])

  const assignOptions = useMemo<SelectOption<string>[]>(() => {
    return employeesStore.list.items.map((e) => ({ value: e.id, label: e.fullName }))
  }, [employeesStore.list.items])

  if (!item) return null

  const isEmployee = item.subjectType === 'employee'
  const subjectName = item.subjectName ?? (isEmployee ? 'Сотрудник' : 'Команда')
  const subjectHref = isEmployee
    ? item.employeeId
      ? `/employees/${item.employeeId}`
      : null
    : item.teamId
      ? `/teams/${item.teamId}`
      : null

  const availableTransitions = getAvailableTransitions(item.status)
  const primaryTransitions = availableTransitions.filter((t) => PRIMARY_ACTIONS.includes(t))
  const secondaryTransitions = availableTransitions.filter((t) => !PRIMARY_ACTIONS.includes(t))

  const isDirty =
    (notes ?? '') !== (item.notes ?? '') ||
    isoToDateInput(item.dueAt) !== dueAt ||
    (item.assignedToId ?? '') !== assignedToId

  const handleSave = async () => {
    setIsSaving(true)
    const patch: { notes?: string; dueAt?: string; assignedToId?: string } = {}
    if (notes !== (item.notes ?? '')) patch.notes = notes
    if (dueAt !== isoToDateInput(item.dueAt)) {
      const next = dateInputToIso(dueAt)
      if (next) patch.dueAt = next
    }
    if (assignedToId !== (item.assignedToId ?? '')) patch.assignedToId = assignedToId
    await onPatch(item, patch)
    setIsSaving(false)
  }

  return (
    <>
      <div className={s.backdrop} onClick={onClose} aria-hidden="true" />
      <aside
        className={s.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Дорожная карта — детали"
      >
        <header className={s.header}>
          <div className={s.subject}>
            <Avatar
              initials={(
                subjectName
                  .trim()
                  .split(/\s+/)
                  .slice(0, 2)
                  .map((p) => p[0]?.toUpperCase() ?? '')
                  .join('') || '??'
              ).slice(0, 2)}
              fullName={subjectName}
              src={item.subjectAvatarUrl}
              colorSeed={item.subjectId}
              shape={isEmployee ? 'round' : 'squircle'}
              size="md"
            />
            <div className={s.subjectText}>
              {subjectHref ? (
                <Link href={subjectHref} className={s.subjectName}>
                  {subjectName}
                </Link>
              ) : (
                <span className={s.subjectName}>{subjectName}</span>
              )}
              <span className={s.subjectMeta}>
                P{Math.round(item.priorityScore)} · {item.title}
              </span>
            </div>
          </div>
          <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Закрыть">
            <XSmallIcon />
          </button>
        </header>

        <div className={s.badges}>
          <Badge tone={ROADMAP_STATUS_TONE[item.status]} size="sm" pill>
            {ROADMAP_STATUS_LABEL_RU[item.status]}
          </Badge>
          <Badge tone={ROADMAP_SEVERITY_TONE[item.severity]} size="sm" pill>
            {ROADMAP_SEVERITY_LABEL_RU[item.severity]}
          </Badge>
        </div>

        <div className={s.section}>
          <div className={s.sectionLabel}>Причина</div>
          <p className={s.text}>{item.reason}</p>
        </div>

        <div className={s.section}>
          <div className={s.sectionLabel}>Рекомендованное действие</div>
          <p className={s.text}>{item.action}</p>
        </div>

        <div className={s.section}>
          <label className={s.fieldLabel}>
            <span>Заметки</span>
            <textarea
              className={s.textarea}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Контекст, договорённости, статус по существу…"
              rows={4}
            />
          </label>
        </div>

        <div className={s.grid}>
          <label className={s.fieldLabel}>
            <span>Срок (due)</span>
            <input
              type="date"
              className={s.input}
              value={dueAt}
              onChange={(e) => setDueAt(e.target.value)}
            />
          </label>

          <label className={s.fieldLabel}>
            <span>Ответственный</span>
            <Select<string>
              value={assignedToId}
              onValueChange={(v) => setAssignedToId(v)}
              options={assignOptions}
              size="md"
              placeholder="Не назначен"
            />
          </label>
        </div>

        {item.metricSnapshot && Object.keys(item.metricSnapshot).length > 0 && (
          <div className={s.section}>
            <button
              type="button"
              className={s.snapshotToggle}
              onClick={() => setShowSnapshot((v) => !v)}
            >
              {showSnapshot ? '▾' : '▸'} Показатели на момент создания
            </button>
            {showSnapshot && (
              <pre className={s.snapshot}>{JSON.stringify(item.metricSnapshot, null, 2)}</pre>
            )}
          </div>
        )}

        <div className={s.actions}>
          {primaryTransitions.map((status, idx) => (
            <Button
              key={status}
              variant={idx === 0 ? 'primary' : 'secondary'}
              size="md"
              leftIcon={STATUS_ACTION_ICON[status]}
              onClick={() => onSetStatus(item, status)}
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
            >
              {STATUS_ACTION_LABEL[status] ?? ROADMAP_STATUS_LABEL_RU[status]}
            </Button>
          ))}
        </div>

        <div className={s.footer}>
          <Button
            variant="ghost"
            size="md"
            leftIcon={<XSmallIcon />}
            onClick={() => onDelete(item)}
          >
            Удалить
          </Button>
          <Button variant="primary" size="md" onClick={handleSave} disabled={!isDirty || isSaving}>
            {isSaving ? 'Сохраняем…' : 'Сохранить'}
          </Button>
        </div>
      </aside>
    </>
  )
}
