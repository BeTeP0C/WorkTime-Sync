'use client'

import { useEffect } from 'react'

import { CreateScheduleExceptionPayload } from '@/entities/exception/api'
import { XSmallIcon } from '@/shared/icons'
import { ExceptionForm } from '@/widgets/ExceptionForm'

import s from './AddExceptionDrawer.module.scss'

interface Props {
  isSubmitting: boolean
  error: string | null
  onClose: () => void
  onSubmit: (payload: CreateScheduleExceptionPayload) => Promise<void> | void
}

export function AddExceptionDrawer({ isSubmitting, error, onClose, onSubmit }: Props) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <>
      <div className={s.backdrop} onClick={onClose} aria-hidden="true" />
      <aside
        className={s.drawer}
        role="dialog"
        aria-modal="true"
        aria-label="Добавление исключения"
      >
        <div className={s.header}>
          <div className={s.title}>Новое исключение</div>
          <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Закрыть">
            <XSmallIcon />
          </button>
        </div>

        <ExceptionForm
          isSubmitting={isSubmitting}
          error={error}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </aside>
    </>
  )
}
