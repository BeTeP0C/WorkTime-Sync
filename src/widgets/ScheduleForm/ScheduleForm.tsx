'use client'

import { useEffect, useMemo, useState } from 'react'

import { CreateWorkSchedulePayload } from '@/entities/schedule/api'
import { TIMEZONE_OPTIONS, WORK_FORMAT_OPTIONS } from '@/entities/schedule/model/options'
import { WeekDayIndex, WorkFormat, WorkSchedule } from '@/entities/schedule/model/types'
import { validateSchedulePayload } from '@/entities/schedule/model/validation'
import { WeekdayChips } from '@/entities/schedule/ui/WeekdayChips'
import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Select, SelectOption } from '@/shared/ui/Select'

import s from './ScheduleForm.module.scss'

const DEFAULT_WORK_DAYS: WeekDayIndex[] = [0, 1, 2, 3, 4]
const DEFAULT_START_TIME = '09:00'
const DEFAULT_END_TIME = '18:00'
const DEFAULT_WORK_FORMAT: WorkFormat = 'office'

export interface ScheduleFormProps {
  schedule: WorkSchedule | null
  fallbackTimezone: string
  fallbackWorkFormat?: WorkFormat
  isSubmitting: boolean
  error: string | null
  onSubmit: (payload: CreateWorkSchedulePayload) => Promise<void> | void
  onCancel?: () => void
  submitLabel?: string
  cancelLabel?: string
}

export function ScheduleForm({
  schedule,
  fallbackTimezone,
  fallbackWorkFormat = DEFAULT_WORK_FORMAT,
  isSubmitting,
  error,
  onSubmit,
  onCancel,
  submitLabel = 'Сохранить',
  cancelLabel = 'Отмена',
}: ScheduleFormProps) {
  const [workDays, setWorkDays] = useState<WeekDayIndex[]>(schedule?.workDays ?? DEFAULT_WORK_DAYS)
  const [startTime, setStartTime] = useState<string>(schedule?.startTime ?? DEFAULT_START_TIME)
  const [endTime, setEndTime] = useState<string>(schedule?.endTime ?? DEFAULT_END_TIME)
  const [timezone, setTimezone] = useState<string>(schedule?.timezone ?? fallbackTimezone)
  const [workFormat, setWorkFormat] = useState<WorkFormat>(
    schedule?.workFormat ?? fallbackWorkFormat
  )
  const [validationError, setValidationError] = useState<string | null>(null)

  // Подтягиваем актуальные значения, если расписание обновилось снаружи (другой запрос/моки).
  useEffect(() => {
    if (!schedule) return
    setWorkDays(schedule.workDays)
    setStartTime(schedule.startTime)
    setEndTime(schedule.endTime)
    setTimezone(schedule.timezone)
    setWorkFormat(schedule.workFormat)
  }, [schedule])

  const timezoneOptions = useMemo<SelectOption<string>[]>(() => {
    if (timezone && !TIMEZONE_OPTIONS.some((o) => o.value === timezone)) {
      return [{ value: timezone, label: timezone }, ...TIMEZONE_OPTIONS]
    }
    return TIMEZONE_OPTIONS
  }, [timezone])

  const handleSubmit = async (): Promise<void> => {
    const payload: CreateWorkSchedulePayload = {
      workDays,
      startTime,
      endTime,
      timezone,
      workFormat,
    }
    const validation = validateSchedulePayload(payload)
    if (validation) {
      setValidationError(validation)
      return
    }
    setValidationError(null)
    await onSubmit(payload)
  }

  return (
    <div className={s.form}>
      <div className={s.section}>
        <div className={s.sectionLabel}>Рабочие дни</div>
        <WeekdayChips value={workDays} onChange={setWorkDays} disabled={isSubmitting} />
      </div>

      <div className={s.grid}>
        <Input
          label="Начало рабочего дня"
          type="time"
          step={900}
          value={startTime}
          onChange={(e) => setStartTime(e.target.value)}
          disabled={isSubmitting}
          fullWidth
        />
        <Input
          label="Окончание рабочего дня"
          type="time"
          step={900}
          value={endTime}
          onChange={(e) => setEndTime(e.target.value)}
          disabled={isSubmitting}
          fullWidth
        />
      </div>

      <div className={s.section}>
        <div className={s.sectionLabel}>Формат работы</div>
        <Select
          value={workFormat}
          onValueChange={(v) => {
            if (v) setWorkFormat(v)
          }}
          options={WORK_FORMAT_OPTIONS}
          placeholder="Выберите формат работы"
          disabled={isSubmitting}
        />
      </div>

      <div className={s.section}>
        <div className={s.sectionLabel}>Часовой пояс</div>
        <Select
          value={timezone}
          onValueChange={(v) => setTimezone(v)}
          options={timezoneOptions}
          placeholder="Выберите часовой пояс"
          disabled={isSubmitting}
        />
      </div>

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
