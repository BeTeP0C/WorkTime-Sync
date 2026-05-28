import cn from 'classnames'

import { WEEKDAY_LABEL_RU, WeekDayIndex } from '../../model/types'

import s from './WeekdayChips.module.scss'

const ALL_DAYS: WeekDayIndex[] = [0, 1, 2, 3, 4, 5, 6]

interface Props {
  value: WeekDayIndex[]
  onChange: (next: WeekDayIndex[]) => void
  disabled?: boolean
}

export function WeekdayChips({ value, onChange, disabled }: Props) {
  const toggle = (day: WeekDayIndex): void => {
    const next = value.includes(day)
      ? value.filter((d) => d !== day)
      : [...value, day].sort((a, b) => a - b)
    onChange(next)
  }

  return (
    <div className={s.row}>
      {ALL_DAYS.map((day) => (
        <button
          key={day}
          type="button"
          className={cn(s.chip, value.includes(day) && s.chipActive)}
          onClick={() => toggle(day)}
          disabled={disabled}
        >
          {WEEKDAY_LABEL_RU[day]}
        </button>
      ))}
    </div>
  )
}
