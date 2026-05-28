'use client'

import { ReactNode, useEffect, useId, useRef } from 'react'

import { Button } from '@/shared/ui/Button'
import { Modal } from '@/shared/ui/Modal'

import s from './ConfirmDialog.module.scss'

export interface ConfirmDialogProps {
  open: boolean
  title: string
  body?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = 'Подтвердить',
  cancelLabel = 'Отмена',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const titleId = useId()
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    // Автофокус на безопасную кнопку (Cancel).
    const id = window.setTimeout(() => cancelRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !loading) {
        e.preventDefault()
        onConfirm()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, loading, onConfirm])

  return (
    <Modal open={open} onClose={onCancel} labelledBy={titleId}>
      <h2 id={titleId} className={s.title}>
        {title}
      </h2>
      {body && <div className={s.body}>{body}</div>}
      <div className={s.actions}>
        <Button ref={cancelRef} variant="ghost" size="md" onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={danger ? 'danger' : 'primary'}
          size="md"
          onClick={onConfirm}
          disabled={loading}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}
