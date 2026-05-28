'use client'

import { ReactNode, useEffect, useId, useRef, useState } from 'react'

import { Button } from '@/shared/ui/Button'
import { Input } from '@/shared/ui/Input'
import { Modal } from '@/shared/ui/Modal'

import s from './PromptDialog.module.scss'

export interface PromptDialogProps {
  open: boolean
  title: string
  body?: ReactNode
  placeholder?: string
  initialValue?: string
  confirmLabel?: string
  cancelLabel?: string
  multiline?: boolean
  loading?: boolean
  onConfirm: (value: string) => void
  onCancel: () => void
}

export function PromptDialog({
  open,
  title,
  body,
  placeholder,
  initialValue = '',
  confirmLabel = 'Отправить',
  cancelLabel = 'Отмена',
  multiline = false,
  loading = false,
  onConfirm,
  onCancel,
}: PromptDialogProps) {
  const titleId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [value, setValue] = useState(initialValue)

  useEffect(() => {
    if (open) setValue(initialValue)
  }, [open, initialValue])

  useEffect(() => {
    if (!open) return
    const id = window.setTimeout(
      () => (multiline ? textareaRef.current : inputRef.current)?.focus(),
      0
    )
    return () => window.clearTimeout(id)
  }, [open, multiline])

  const handleConfirm = (): void => {
    if (loading) return
    onConfirm(value.trim())
  }

  return (
    <Modal open={open} onClose={onCancel} labelledBy={titleId}>
      <h2 id={titleId} className={s.title}>
        {title}
      </h2>
      {body && <div className={s.body}>{body}</div>}
      <div className={s.field}>
        {multiline ? (
          <textarea
            ref={textareaRef}
            className={s.textarea}
            value={value}
            placeholder={placeholder}
            disabled={loading}
            rows={3}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                e.preventDefault()
                handleConfirm()
              }
            }}
          />
        ) : (
          <Input
            ref={inputRef}
            value={value}
            placeholder={placeholder}
            disabled={loading}
            fullWidth
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                handleConfirm()
              }
            }}
          />
        )}
      </div>
      <div className={s.actions}>
        <Button variant="ghost" size="md" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button variant="primary" size="md" onClick={handleConfirm} disabled={loading}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
