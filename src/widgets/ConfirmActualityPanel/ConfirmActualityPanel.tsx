'use client'

import { ScheduleConfirmationRequest } from '@/entities/confirmation/model/types'
import { formatDateMonth } from '@/shared/lib/format'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'

import s from './ConfirmActualityPanel.module.scss'

interface ConfirmActualityPanelProps {
  daysSinceUpdate: number
  scheduleConfirmedAt: string | null
  pendingRequest: ScheduleConfirmationRequest | null
  isConfirming: boolean
  onConfirm: () => void | Promise<void>
  onRequestUpdate: () => void
}

export function ConfirmActualityPanel({
  daysSinceUpdate,
  scheduleConfirmedAt,
  pendingRequest,
  isConfirming,
  onConfirm,
  onRequestUpdate,
}: ConfirmActualityPanelProps) {
  const hasPending = Boolean(pendingRequest)
  const lastConfirmedLabel = scheduleConfirmedAt ? formatDateMonth(scheduleConfirmedAt) : '—'

  return (
    <Card padding="lg" className={s.card}>
      <CardHeader title="Подтверждение актуальности" />
      <p className={s.lead}>
        Пожалуйста, проверьте, актуальны ли ваши данные о рабочем времени. Если всё верно —
        подтвердите. Если что-то изменилось — перейдите к редактированию.
      </p>

      <div className={s.meta}>
        <div className={s.metaRow}>
          <span className={s.metaLabel}>Последнее обновление</span>
          <span className={s.metaValue}>{daysSinceUpdate} дн. назад</span>
        </div>
        <div className={s.metaRow}>
          <span className={s.metaLabel}>Подтверждено</span>
          <span className={s.metaValue}>{lastConfirmedLabel}</span>
        </div>
        {pendingRequest && (
          <>
            <div className={s.metaRow}>
              <span className={s.metaLabel}>Запрос от HR</span>
              <span className={s.metaValue}>{formatDateMonth(pendingRequest.createdAt)}</span>
            </div>
            <div className={s.metaRow}>
              <span className={s.metaLabel}>Статус</span>
              <span className={`${s.metaValue} ${s.metaStatusPending}`}>Нет ответа</span>
            </div>
          </>
        )}
      </div>

      <div className={s.actions}>
        <button
          type="button"
          className={s.confirmButton}
          onClick={() => void onConfirm()}
          disabled={isConfirming}
        >
          {isConfirming ? 'Сохраняем…' : '✓ Всё актуально, подтверждаю'}
        </button>
        <Button
          type="button"
          variant="secondary"
          size="md"
          className={s.updateButton}
          onClick={onRequestUpdate}
        >
          {hasPending ? 'Обновить данные (есть запрос)' : '− Обновить данные'}
        </Button>
      </div>
    </Card>
  )
}
