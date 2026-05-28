'use client'

import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'

import { useAuthStore, useNotificationsStore } from '@/app-store/context'
import { isManagementRole } from '@/entities/auth/model/types'
import { ScheduleConfirmationRequest } from '@/entities/confirmation/model/types'
import { formatDateMonth } from '@/shared/lib/format'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'
import { usePrompt } from '@/shared/ui/PromptDialog'
import { AiDailyTip } from '@/widgets/AiDailyTip'
import { AppHeader } from '@/widgets/AppHeader'
import { PageLoadError } from '@/widgets/ErrorScreen'

import s from './NotificationsClient.module.scss'

export const NotificationsClient = observer(function NotificationsClient() {
  const auth = useAuthStore()
  const notifications = useNotificationsStore()
  const prompt = usePrompt()

  const userId = auth.currentUser.value?.id ?? null

  useEffect(() => {
    if (userId) notifications.loadForCurrentUser(userId)
  }, [userId, notifications])

  if (!userId) {
    return (
      <>
        <AppHeader title="Уведомления" />
        <Card padding="lg">
          <p>Авторизуйтесь, чтобы видеть уведомления.</p>
        </Card>
      </>
    )
  }

  if (notifications.loadingStage.isError && notifications.requests.value.length === 0) {
    return (
      <>
        <AppHeader title="Уведомления" />
        <PageLoadError
          description="Не удалось загрузить уведомления. Попробуйте ещё раз."
          onRetry={() => notifications.loadForCurrentUser(userId)}
        />
      </>
    )
  }

  const items = notifications.requests.value.filter((r) => r.status === 'pending')

  const handleConfirm = async () => {
    await notifications.confirm(userId)
  }

  const handleDecline = async (request: ScheduleConfirmationRequest) => {
    const note = await prompt({
      title: 'Отклонить запрос?',
      body: 'Запрос будет помечен как отклонённый. Комментарий увидит HR.',
      placeholder: 'Например: график вернётся к стандартному после спринта',
      confirmLabel: 'Отклонить',
      multiline: true,
    })
    if (note === null) return // отмена — не отклоняем запрос
    await notifications.decline(userId, request.id, note.length > 0 ? note : null)
  }

  const currentUser = auth.currentUser.value
  const showDailyTip = currentUser !== null && !isManagementRole(currentUser.role)

  return (
    <>
      <AppHeader title="Уведомления" />
      <div className={s.content}>
        <Card padding="lg">
          <CardHeader title="Запросы на подтверждение графика" />
          {items.length === 0 ? (
            <p className={s.empty}>Активных запросов нет.</p>
          ) : (
            <ul className={s.list}>
              {items.map((request) => (
                <li key={request.id} className={s.item}>
                  <div className={s.itemBody}>
                    <div className={s.itemTitle}>
                      {request.requestedByName ?? 'Система'} запрашивает подтверждение
                    </div>
                    <div className={s.itemMeta}>{formatDateMonth(request.createdAt)}</div>
                    {request.reason && <div className={s.itemReason}>{request.reason}</div>}
                  </div>
                  <div className={s.itemActions}>
                    <Button variant="primary" size="md" onClick={handleConfirm}>
                      Подтвердить график
                    </Button>
                    <Button variant="secondary" size="md" onClick={() => handleDecline(request)}>
                      Отклонить
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>

        {showDailyTip && (
          <aside className={s.sidebar}>
            <AiDailyTip employeeId={userId} />
          </aside>
        )}
      </div>
    </>
  )
})
