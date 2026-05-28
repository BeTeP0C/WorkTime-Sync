'use client'

import { useState } from 'react'

import {
  CreateScheduleExceptionPayload,
  UpdateScheduleExceptionPayload,
} from '@/entities/exception/api'
import { ExceptionType, ScheduleException } from '@/entities/exception/model/types'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'

import { ExceptionTypeCards } from './ExceptionTypeCards'

import s from './InlineExceptionForm.module.scss'

function toLocalInputValue(d: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function defaultStart(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(9, 0, 0, 0)
  return toLocalInputValue(d)
}

function defaultEnd(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  d.setHours(18, 0, 0, 0)
  return toLocalInputValue(d)
}

function isoToLocalInput(iso: string): string {
  return toLocalInputValue(new Date(iso))
}

export type InlineExceptionFormMode =
  | { kind: 'create' }
  | { kind: 'edit'; initial: ScheduleException }

interface Props {
  mode: InlineExceptionFormMode
  isSubmitting: boolean
  error: string | null
  onSubmit: (
    payload: CreateScheduleExceptionPayload | UpdateScheduleExceptionPayload
  ) => Promise<boolean>
  onCancel: () => void
  onDelete?: () => Promise<boolean>
}

export function InlineExceptionForm({
  mode,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
  onDelete,
}: Props) {
  const isEdit = mode.kind === 'edit'
  const initial = mode.kind === 'edit' ? mode.initial : null

  const [type, setType] = useState<ExceptionType>(initial?.type ?? 'vacation')
  const [startDt, setStartDt] = useState<string>(
    initial ? isoToLocalInput(initial.startDt) : defaultStart()
  )
  const [endDt, setEndDt] = useState<string>(
    initial ? isoToLocalInput(initial.endDt) : defaultEnd()
  )
  const [reason, setReason] = useState<string>(initial?.reason ?? '')
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    if (!startDt || !endDt) {
      setValidationError('Укажите начало и конец периода')
      return
    }
    const start = new Date(startDt)
    const end = new Date(endDt)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      setValidationError('Некорректная дата')
      return
    }
    if (start.getTime() >= end.getTime()) {
      setValidationError('Начало должно быть раньше окончания')
      return
    }
    setValidationError(null)

    const payload = {
      type,
      startDt: start.toISOString(),
      endDt: end.toISOString(),
      reason: reason.trim() ? reason.trim() : null,
    }
    await onSubmit(payload)
  }

  const submitLabel = isEdit ? 'Сохранить' : 'Добавить исключение'

  return (
    <form className={s.form} onSubmit={handleSubmit}>
      <div className={s.title}>{isEdit ? 'Редактирование исключения' : 'Добавить исключение'}</div>

      <ExceptionTypeCards value={type} onChange={setType} disabled={isSubmitting} />

      <div className={s.dates}>
        <Input
          label="Начало"
          type="datetime-local"
          value={startDt}
          onChange={(e) => setStartDt(e.target.value)}
          disabled={isSubmitting}
          fullWidth
        />
        <Input
          label="Окончание"
          type="datetime-local"
          value={endDt}
          onChange={(e) => setEndDt(e.target.value)}
          disabled={isSubmitting}
          fullWidth
        />
      </div>

      <Input
        label="Причина (необязательно)"
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Например, плановый отпуск"
        disabled={isSubmitting}
        fullWidth
      />

      {(validationError || error) && <div className={s.errorBlock}>{validationError || error}</div>}

      <div className={s.footer}>
        <div className={s.footerLeft}>
          {isEdit && onDelete && (
            <Button
              type="button"
              variant="secondary"
              size="md"
              onClick={onDelete}
              disabled={isSubmitting}
            >
              Удалить
            </Button>
          )}
        </div>
        <div className={s.footerRight}>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Отмена
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
            {isSubmitting ? 'Сохраняем…' : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  )
}
