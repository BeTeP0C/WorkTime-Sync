import { forwardRef, InputHTMLAttributes, ReactNode, useId } from 'react'
import cn from 'classnames'

import s from './Input.module.scss'

export type InputSize = 'sm' | 'md' | 'lg'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  size?: InputSize
  leftIcon?: ReactNode
  rightSlot?: ReactNode
  fullWidth?: boolean
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    label,
    hint,
    error,
    size = 'md',
    leftIcon,
    rightSlot,
    fullWidth,
    className,
    id,
    type = 'text',
    ...rest
  },
  ref
) {
  const autoId = useId()
  const inputId = id ?? autoId
  // Связываем сообщение об ошибке/хинт с input через aria-describedby,
  // чтобы screen reader озвучил его при фокусе на поле.
  const messageId = error || hint ? `${inputId}-msg` : undefined

  return (
    <div className={cn(s.root, fullWidth && s.fullWidth, className)}>
      {label && (
        <label htmlFor={inputId} className={s.label}>
          {label}
        </label>
      )}
      <div
        className={cn(
          s.field,
          s[`size_${size}`],
          leftIcon ? s.hasLeft : undefined,
          rightSlot ? s.hasRight : undefined,
          error ? s.fieldError : undefined
        )}
      >
        {leftIcon && <span className={s.leftIcon}>{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={s.input}
          aria-invalid={error ? true : undefined}
          aria-describedby={messageId}
          {...rest}
        />
        {rightSlot && <span className={s.rightSlot}>{rightSlot}</span>}
      </div>
      {(error || hint) && (
        <div
          id={messageId}
          className={cn(s.message, error ? s.messageError : undefined)}
          role={error ? 'alert' : undefined}
        >
          {error || hint}
        </div>
      )}
    </div>
  )
})
