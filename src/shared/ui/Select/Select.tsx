'use client'

import { ReactNode, SelectHTMLAttributes } from 'react'
import cn from 'classnames'

import s from './Select.module.scss'

export interface SelectOption<T extends string = string> {
  value: T
  label: string
}

interface SelectProps<T extends string = string> extends Omit<
  SelectHTMLAttributes<HTMLSelectElement>,
  'onChange' | 'value' | 'size'
> {
  value: T | ''
  onValueChange: (value: T | '') => void
  options: SelectOption<T>[]
  placeholder?: string
  size?: 'sm' | 'md'
  leftIcon?: ReactNode
}

export function Select<T extends string = string>({
  value,
  onValueChange,
  options,
  placeholder = 'Все',
  size = 'md',
  leftIcon,
  className,
  ...rest
}: SelectProps<T>) {
  return (
    <div className={cn(s.wrap, Boolean(leftIcon) && s.hasIcon, className)}>
      {leftIcon && <span className={s.icon}>{leftIcon}</span>}
      <select
        className={cn(s.select, s[`size_${size}`], Boolean(leftIcon) && s.selectWithIcon)}
        value={value}
        onChange={(e) => onValueChange(e.target.value as T | '')}
        {...rest}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
