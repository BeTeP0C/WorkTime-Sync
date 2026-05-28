'use client'

import { useState } from 'react'

import { CreateScheduleExceptionPayload } from '@/entities/exception/api'
import { EXCEPTION_LABEL_RU, ExceptionType } from '@/entities/exception/model/types'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Select, SelectOption } from '@/shared/ui/Select'

import s from './ExceptionForm.module.scss'

const TYPE_OPTIONS: SelectOption<ExceptionType>[] = [
  { value: 'vacation', label: EXCEPTION_LABEL_RU.vacation },
  { value: 'sick_leave', label: EXCEPTION_LABEL_RU.sick_leave },
  { value: 'business_trip', label: EXCEPTION_LABEL_RU.business_trip },
]

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

/** Преобразует Date в значение для <input type="datetime-local"> (local time, без таймзоны). */
function toLocalInputValue(d: Date): string {
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export interface ExceptionFormProps {
  isSubmitting: boolean
  error: string | null
  onSubmit: (payload: CreateScheduleExceptionPayload) => Promise<void> | void
  onCancel?: () => void
  submitLabel?: string
  cancelLabel?: string
  /** Если true — после успешной отправки форма сама сбрасывает поля. Полезно для page-режима. */
  resetOnSuccess?: boolean
}

export function ExceptionForm({
  isSubmitting,
  error,
  onSubmit,
  onCancel,
  submitLabel = 'Добавить',
  cancelLabel = 'Отмена',
  resetOnSuccess = false,
}: ExceptionFormProps) {
  const [type, setType] = useState<ExceptionType | ''>('vacation')
  const [startDt, setStartDt] = useState<string>(defaultStart())
  const [endDt, setEndDt] = useState<string>(defaultEnd())
  const [reason, setReason] = useState<string>('')
  const [validationError, setValidationError] = useState<string | null>(null)

  const reset = (): void => {
    setType('vacation')
    setStartDt(defaultStart())
    setEndDt(defaultEnd())
    setReason('')
    setValidationError(null)
  }

  const handleSubmit = async (): Promise<void> => {
    if (!type) {
      setValidationError('Выберите тип исключения')
      return
    }
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
    await onSubmit({
      type,
      startDt: start.toISOString(),
      endDt: end.toISOString(),
      reason: reason.trim() ? reason.trim() : null,
    })
    if (resetOnSuccess) reset()
  }

  return (
    <div className={s.form}>
      <div className={s.section}>
        <div className={s.sectionLabel}>Тип</div>
        <Select<ExceptionType>
          value={type}
          onValueChange={(v) => setType(v)}
          options={TYPE_OPTIONS}
          placeholder="Выберите тип"
          disabled={isSubmitting}
        />
      </div>

      <div className={s.grid}>
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
        {onCancel && (
          <Button variant="secondary" size="md" onClick={onCancel} disabled={isSubmitting}>
            {cancelLabel}
          </Button>
        )}
        <Button variant="primary" size="md" onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Сохраняем…' : submitLabel}
        </Button>
      </div>
    </div>
  )
}
