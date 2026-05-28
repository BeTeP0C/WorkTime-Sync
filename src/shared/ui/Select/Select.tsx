'use client'

import {
  KeyboardEvent,
  ReactNode,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from 'react'
import cn from 'classnames'

import s from './Select.module.scss'

export interface SelectOption<T extends string = string> {
  value: T
  label: string
}

interface SelectProps<T extends string = string> {
  value: T | ''
  onValueChange: (value: T | '') => void
  options: SelectOption<T>[]
  placeholder?: string
  size?: 'sm' | 'md'
  leftIcon?: ReactNode
  className?: string
  disabled?: boolean
  name?: string
  id?: string
  'aria-label'?: string
  'aria-labelledby'?: string
}

export function Select<T extends string = string>({
  value,
  onValueChange,
  options,
  placeholder = 'Все',
  size = 'md',
  leftIcon,
  className,
  disabled,
  name,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false)
  const [highlightIdx, setHighlightIdx] = useState<number>(-1)
  const triggerRef = useRef<HTMLButtonElement | null>(null)
  const popoverRef = useRef<HTMLDivElement | null>(null)
  const generatedId = useId()
  const listboxId = id ? `${id}-listbox` : `select-${generatedId}-listbox`

  // value === '' соответствует пункту-плейсхолдеру (idx 0 в полном списке).
  const allItems = useMemo(
    () => [{ value: '' as T | '', label: placeholder }, ...options],
    [placeholder, options]
  )

  const selectedIdx = allItems.findIndex((o) => o.value === value)
  const selectedLabel = selectedIdx >= 0 ? allItems[selectedIdx].label : placeholder

  // Закрытие по клику вне.
  useEffect(() => {
    if (!open) return
    const handler = (event: MouseEvent) => {
      const target = event.target as Node
      if (popoverRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return
      }
      setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  // Закрытие по Escape; при открытии — подсветка на выбранном.
  useEffect(() => {
    if (!open) return
    setHighlightIdx(selectedIdx >= 0 ? selectedIdx : 0)
    const handler = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, selectedIdx])

  // Прокрутка к подсвеченной опции внутри popover.
  useEffect(() => {
    if (!open || highlightIdx < 0) return
    const node = popoverRef.current?.querySelector<HTMLElement>(`[data-idx="${highlightIdx}"]`)
    node?.scrollIntoView({ block: 'nearest' })
  }, [open, highlightIdx])

  const choose = useCallback(
    (next: T | '') => {
      onValueChange(next)
      setOpen(false)
      triggerRef.current?.focus()
    },
    [onValueChange]
  )

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>): void => {
    if (disabled) return
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
    }
  }

  const onListKeyDown = (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightIdx((idx) => Math.min(allItems.length - 1, idx + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightIdx((idx) => Math.max(0, idx - 1))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setHighlightIdx(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setHighlightIdx(allItems.length - 1)
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      const target = allItems[highlightIdx]
      if (target) choose(target.value)
    } else if (e.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div className={cn(s.wrap, Boolean(leftIcon) && s.hasIcon, className)}>
      {leftIcon && (
        <span className={s.icon} aria-hidden>
          {leftIcon}
        </span>
      )}
      <button
        ref={triggerRef}
        type="button"
        id={id}
        name={name}
        disabled={disabled}
        className={cn(
          s.trigger,
          s[`size_${size}`],
          Boolean(leftIcon) && s.triggerWithIcon,
          open && s.triggerOpen,
          value === '' && s.triggerPlaceholder
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-controls={open ? listboxId : undefined}
        onClick={() => !disabled && setOpen((v) => !v)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className={s.triggerLabel}>{selectedLabel}</span>
        <span className={cn(s.chevron, open && s.chevronOpen)} aria-hidden>
          <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
            <path
              d="M1 1l4 4 4-4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>

      {open && (
        <div
          ref={popoverRef}
          id={listboxId}
          role="listbox"
          aria-activedescendant={highlightIdx >= 0 ? `${listboxId}-${highlightIdx}` : undefined}
          tabIndex={-1}
          className={s.popover}
          onKeyDown={onListKeyDown}
        >
          {allItems.map((opt, idx) => {
            const selected = opt.value === value
            const highlighted = idx === highlightIdx
            return (
              <button
                key={`${opt.value}-${idx}`}
                id={`${listboxId}-${idx}`}
                type="button"
                role="option"
                aria-selected={selected}
                data-idx={idx}
                className={cn(
                  s.option,
                  selected && s.optionSelected,
                  highlighted && s.optionHighlighted
                )}
                onMouseEnter={() => setHighlightIdx(idx)}
                onClick={() => choose(opt.value)}
              >
                <span className={s.optionCheck} aria-hidden>
                  {selected ? '✓' : ''}
                </span>
                <span className={s.optionLabel}>{opt.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
