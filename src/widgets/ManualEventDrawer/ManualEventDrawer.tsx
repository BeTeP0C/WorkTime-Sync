'use client'

import { useEffect, useMemo, useState } from 'react'

import { CreateManualEventPayload } from '@/entities/activity-event/api'
import {
  ACTIVITY_EVENT_TYPES,
  ActivityEventType,
  EVENT_TYPE_LABEL_RU,
} from '@/entities/activity-event/model/types'
import { XSmallIcon } from '@/shared/icons'
import { Button } from '@/shared/ui/Button'
import { Select, SelectOption } from '@/shared/ui/Select'

import s from './ManualEventDrawer.module.scss'

const DEFAULT_TIMEZONES = [
  'Europe/Moscow',
  'Europe/Kaliningrad',
  'Asia/Yekaterinburg',
  'Europe/London',
  'Asia/Novosibirsk',
  'Asia/Vladivostok',
  'UTC',
]

const EVENT_TYPE_OPTIONS: SelectOption<ActivityEventType>[] = ACTIVITY_EVENT_TYPES.map((type) => ({
  value: type,
  label: EVENT_TYPE_LABEL_RU[type],
}))

function localInputToIso(value: string, timezone: string): string | null {
  if (!value) return null
  // Парсим как локальное время в указанном TZ и получаем ISO строку с offset'ом.
  try {
    const parts = value.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/)
    if (!parts) return null
    const [, y, m, d, hh, mm, ss] = parts
    const naive = `${y}-${m}-${d}T${hh}:${mm}:${ss ?? '00'}`
    const offset = getTimezoneOffset(timezone, new Date(`${naive}Z`))
    const sign = offset >= 0 ? '+' : '-'
    const abs = Math.abs(offset)
    const offsetH = String(Math.floor(abs / 60)).padStart(2, '0')
    const offsetM = String(abs % 60).padStart(2, '0')
    return `${naive}${sign}${offsetH}:${offsetM}`
  } catch {
    return null
  }
}

function getTimezoneOffset(timeZone: string, date: Date): number {
  // Возвращает смещение TZ от UTC в минутах для указанной даты.
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
    const parts = formatter.formatToParts(date).reduce<Record<string, string>>((acc, part) => {
      if (part.type !== 'literal') acc[part.type] = part.value
      return acc
    }, {})
    const asUtc = Date.UTC(
      Number(parts.year),
      Number(parts.month) - 1,
      Number(parts.day),
      Number(parts.hour),
      Number(parts.minute),
      Number(parts.second)
    )
    return Math.round((asUtc - date.getTime()) / 60000)
  } catch {
    return 0
  }
}

interface ManualEventDrawerProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (payload: Omit<CreateManualEventPayload, 'employeeId'>) => Promise<boolean>
  defaultTimezone: string
  errorMessage?: string | null
  isSubmitting?: boolean
}

export function ManualEventDrawer({
  isOpen,
  onClose,
  onSubmit,
  defaultTimezone,
  errorMessage,
  isSubmitting,
}: ManualEventDrawerProps) {
  const [title, setTitle] = useState('')
  const [eventType, setEventType] = useState<ActivityEventType>('meeting')
  const [startDt, setStartDt] = useState('')
  const [endDt, setEndDt] = useState('')
  const [timezone, setTimezone] = useState(defaultTimezone)
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurrenceRule, setRecurrenceRule] = useState('')
  const [localError, setLocalError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) {
      setTitle('')
      setEventType('meeting')
      setStartDt('')
      setEndDt('')
      setTimezone(defaultTimezone)
      setIsRecurring(false)
      setRecurrenceRule('')
      setLocalError(null)
    }
  }, [isOpen, defaultTimezone])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const timezoneOptions = useMemo<SelectOption<string>[]>(() => {
    const unique = Array.from(new Set([defaultTimezone, ...DEFAULT_TIMEZONES]))
    return unique.map((tz) => ({ value: tz, label: tz }))
  }, [defaultTimezone])

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLocalError(null)

    if (!title.trim()) {
      setLocalError('Укажите название события')
      return
    }
    const startIso = localInputToIso(startDt, timezone)
    const endIso = localInputToIso(endDt, timezone)
    if (!startIso || !endIso) {
      setLocalError('Заполните дату и время начала/окончания')
      return
    }
    if (new Date(startIso) >= new Date(endIso)) {
      setLocalError('Время начала должно быть раньше времени окончания')
      return
    }
    if (isRecurring && !recurrenceRule.trim()) {
      setLocalError('Укажите правило повторения (RRULE) или снимите чекбокс')
      return
    }

    const ok = await onSubmit({
      title: title.trim(),
      eventType,
      startDt: startIso,
      endDt: endIso,
      timezone,
      isRecurring,
      recurrenceRule: isRecurring ? recurrenceRule.trim() : null,
    })
    if (ok) onClose()
  }

  const errorText = localError ?? errorMessage ?? null

  return (
    <>
      <div className={s.backdrop} onClick={onClose} aria-hidden="true" />
      <aside className={s.drawer} role="dialog" aria-modal="true" aria-label="Добавить событие">
        <header className={s.header}>
          <h3 className={s.title}>Добавить событие</h3>
          <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Закрыть">
            <XSmallIcon />
          </button>
        </header>

        <form className={s.form} onSubmit={handleSubmit}>
          <label className={s.field}>
            <span className={s.fieldLabel}>Название</span>
            <input
              className={s.input}
              type="text"
              maxLength={255}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Daily standup, 1:1, ..."
              required
            />
          </label>

          <label className={s.field}>
            <span className={s.fieldLabel}>Тип события</span>
            <Select
              value={eventType}
              onValueChange={(v) => v && setEventType(v as ActivityEventType)}
              options={EVENT_TYPE_OPTIONS}
            />
          </label>

          <label className={s.field}>
            <span className={s.fieldLabel}>Часовой пояс</span>
            <Select
              value={timezone}
              onValueChange={(v) => v && setTimezone(v)}
              options={timezoneOptions}
            />
          </label>

          <div className={s.row}>
            <label className={s.field}>
              <span className={s.fieldLabel}>Начало</span>
              <input
                className={s.input}
                type="datetime-local"
                value={startDt}
                onChange={(e) => setStartDt(e.target.value)}
                required
              />
            </label>
            <label className={s.field}>
              <span className={s.fieldLabel}>Окончание</span>
              <input
                className={s.input}
                type="datetime-local"
                value={endDt}
                onChange={(e) => setEndDt(e.target.value)}
                required
              />
            </label>
          </div>

          <label className={s.checkboxRow}>
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
            />
            <span>Повторяющееся событие</span>
          </label>

          {isRecurring && (
            <label className={s.field}>
              <span className={s.fieldLabel}>RRULE</span>
              <input
                className={s.input}
                type="text"
                maxLength={500}
                value={recurrenceRule}
                onChange={(e) => setRecurrenceRule(e.target.value)}
                placeholder="FREQ=WEEKLY;BYDAY=MO,WE"
              />
              <span className={s.hint}>
                Формат RFC 5545. Например: <code>FREQ=DAILY;COUNT=10</code> или{' '}
                <code>FREQ=WEEKLY;BYDAY=MO,WE</code>.
              </span>
            </label>
          )}

          {errorText && <div className={s.error}>{errorText}</div>}

          <div className={s.footer}>
            <Button type="button" variant="secondary" size="md" onClick={onClose}>
              Отмена
            </Button>
            <Button type="submit" variant="primary" size="md" disabled={isSubmitting}>
              {isSubmitting ? 'Сохраняем…' : 'Создать'}
            </Button>
          </div>
        </form>
      </aside>
    </>
  )
}
