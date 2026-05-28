import { ComponentType, SVGProps } from 'react'
import cn from 'classnames'

import { EXCEPTION_LABEL_RU, ExceptionType } from '@/entities/exception/model/types'
import { ClockIcon, PlaneIcon, PokerChipIcon, SnowflakeIcon } from '@/shared/icons'

import s from './ExceptionTypeCards.module.scss'

interface TypeOption {
  value: ExceptionType
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

const OPTIONS: TypeOption[] = [
  { value: 'vacation', icon: PokerChipIcon },
  { value: 'sick_leave', icon: SnowflakeIcon },
  { value: 'business_trip', icon: PlaneIcon },
  { value: 'personal_hours', icon: ClockIcon },
]

interface Props {
  value: ExceptionType
  onChange: (value: ExceptionType) => void
  disabled?: boolean
}

export function ExceptionTypeCards({ value, onChange, disabled }: Props) {
  return (
    <div className={s.grid} role="radiogroup" aria-label="Тип исключения">
      {OPTIONS.map(({ value: optionValue, icon: Icon }) => {
        const selected = value === optionValue
        return (
          <button
            type="button"
            key={optionValue}
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(optionValue)}
            className={cn(
              s.card,
              s[`tone_${optionValue}`],
              selected && s.selected,
              disabled && s.disabled
            )}
          >
            <span className={s.icon}>
              <Icon width={20} height={20} />
            </span>
            <span className={s.label}>{EXCEPTION_LABEL_RU[optionValue]}</span>
          </button>
        )
      })}
    </div>
  )
}
