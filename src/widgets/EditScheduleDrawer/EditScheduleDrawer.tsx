'use client'

import { useEffect } from 'react'

import { CreateWorkSchedulePayload } from '@/entities/schedule/api'
import { WorkFormat, WorkSchedule } from '@/entities/schedule/model/types'
import { XSmallIcon } from '@/shared/icons'
import { ScheduleForm } from '@/widgets/ScheduleForm'

import s from './EditScheduleDrawer.module.scss'

interface Props {
  schedule: WorkSchedule | null
  fallbackTimezone: string
  fallbackWorkFormat?: WorkFormat
  isSubmitting: boolean
  error: string | null
  onClose: () => void
  onSubmit: (payload: CreateWorkSchedulePayload) => Promise<void> | void
}

export function EditScheduleDrawer({
  schedule,
  fallbackTimezone,
  fallbackWorkFormat,
  isSubmitting,
  error,
  onClose,
  onSubmit,
}: Props) {
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
        aria-label="Редактирование рабочего графика"
      >
        <div className={s.header}>
          <div className={s.title}>Редактирование рабочего графика</div>
          <button type="button" className={s.closeBtn} onClick={onClose} aria-label="Закрыть">
            <XSmallIcon />
          </button>
        </div>

        <ScheduleForm
          schedule={schedule}
          fallbackTimezone={fallbackTimezone}
          fallbackWorkFormat={fallbackWorkFormat}
          isSubmitting={isSubmitting}
          error={error}
          onSubmit={onSubmit}
          onCancel={onClose}
        />
      </aside>
    </>
  )
}
