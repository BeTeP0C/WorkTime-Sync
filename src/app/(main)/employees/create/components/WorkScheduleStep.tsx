'use client'

import cn from 'classnames'

import { WORK_FORMAT_LABEL_RU, WorkFormat } from '@/entities/employee/model/types'
import { TIMEZONE_OPTIONS } from '@/entities/schedule/model/options'
import { Input } from '@/shared/ui/Input'
import { Select } from '@/shared/ui/Select'

import s from './WorkScheduleStep.module.scss'

const DAYS: Array<{ value: number; label: string }> = [
  { value: 0, label: 'Пн' },
  { value: 1, label: 'Вт' },
  { value: 2, label: 'Ср' },
  { value: 3, label: 'Чт' },
  { value: 4, label: 'Пт' },
  { value: 5, label: 'Сб' },
  { value: 6, label: 'Вс' },
]

const FORMATS: WorkFormat[] = ['office', 'remote', 'hybrid']

export interface WorkScheduleValues {
  workDays: number[]
  startTime: string // 'HH:MM'
  endTime: string
  timezone: string
  workFormat: WorkFormat
}

interface WorkScheduleStepProps {
  values: WorkScheduleValues
  onChange: (patch: Partial<WorkScheduleValues>) => void
  disabled?: boolean
}

export function WorkScheduleStep({ values, onChange, disabled }: WorkScheduleStepProps) {
  const toggleDay = (day: number) => {
    const next = values.workDays.includes(day)
      ? values.workDays.filter((d) => d !== day)
      : [...values.workDays, day].sort((a, b) => a - b)
    onChange({ workDays: next })
  }

  return (
    <div className={s.root}>
      <div className={s.row}>
        <label className={s.field}>
          <span className={s.fieldLabel}>Начало рабочего дня *</span>
          <Input
            size="md"
            type="time"
            value={values.startTime}
            onChange={(e) => onChange({ startTime: e.target.value })}
            fullWidth
            disabled={disabled}
          />
        </label>
        <label className={s.field}>
          <span className={s.fieldLabel}>Конец рабочего дня *</span>
          <Input
            size="md"
            type="time"
            value={values.endTime}
            onChange={(e) => onChange({ endTime: e.target.value })}
            fullWidth
            disabled={disabled}
          />
        </label>
      </div>

      <label className={s.field}>
        <span className={s.fieldLabel}>Часовой пояс *</span>
        <Select<string>
          value={values.timezone}
          onValueChange={(v) => v && onChange({ timezone: v })}
          options={TIMEZONE_OPTIONS}
          placeholder=""
          disabled={disabled}
        />
      </label>

      <div className={s.field}>
        <span className={s.fieldLabel}>Рабочие дни *</span>
        <div className={s.days}>
          {DAYS.map((day) => {
            const active = values.workDays.includes(day.value)
            return (
              <button
                key={day.value}
                type="button"
                className={cn(s.dayChip, active && s.dayChip_active)}
                onClick={() => toggleDay(day.value)}
                disabled={disabled}
                aria-pressed={active}
              >
                {day.label}
              </button>
            )
          })}
        </div>
      </div>

      <div className={s.field}>
        <span className={s.fieldLabel}>Формат работы *</span>
        <div className={s.formats}>
          {FORMATS.map((format) => {
            const active = values.workFormat === format
            return (
              <button
                key={format}
                type="button"
                className={cn(s.formatChip, active && s.formatChip_active)}
                onClick={() => onChange({ workFormat: format })}
                disabled={disabled}
                aria-pressed={active}
              >
                {WORK_FORMAT_LABEL_RU[format]}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
