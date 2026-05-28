import { forwardRef, ReactNode, TextareaHTMLAttributes, useId } from 'react'
import cn from 'classnames'

import s from './Textarea.module.scss'

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode
  hint?: ReactNode
  error?: ReactNode
  fullWidth?: boolean
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, fullWidth, className, id, rows = 3, ...rest },
  ref
) {
  const autoId = useId()
  const textareaId = id ?? autoId

  return (
    <div className={cn(s.root, fullWidth && s.fullWidth, className)}>
      {label && (
        <label htmlFor={textareaId} className={s.label}>
          {label}
        </label>
      )}
      <div className={cn(s.field, error ? s.fieldError : undefined)}>
        <textarea ref={ref} id={textareaId} rows={rows} className={s.textarea} {...rest} />
      </div>
      {(error || hint) && (
        <div className={cn(s.message, error ? s.messageError : undefined)}>{error || hint}</div>
      )}
    </div>
  )
})
