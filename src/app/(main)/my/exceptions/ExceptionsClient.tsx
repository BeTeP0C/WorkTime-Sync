'use client'

import { useEffect, useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { toast } from 'sonner'

import { useAuthStore } from '@/app-store/context'
import { MyExceptionsStore } from '@/app-store/stores/MyExceptionsStore'
import {
  CreateScheduleExceptionPayload,
  UpdateScheduleExceptionPayload,
} from '@/entities/exception/api'
import { ScheduleException } from '@/entities/exception/model/types'
import { InfoIcon, PlusIcon } from '@/shared/icons'
import { Badge } from '@/shared/ui/Badge'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'
import { useConfirm } from '@/shared/ui/ConfirmDialog'
import { AppHeader } from '@/widgets/AppHeader'

import { ExceptionCard } from './components/ExceptionCard'
import { ImpactPanel } from './components/ImpactPanel'
import { InlineExceptionForm, InlineExceptionFormMode } from './components/InlineExceptionForm'
import { MiniCalendar } from './components/MiniCalendar'

import s from './ExceptionsClient.module.scss'

type FormState =
  | { kind: 'closed' }
  | { kind: 'create' }
  | { kind: 'edit'; exception: ScheduleException }

export const ExceptionsClient = observer(function ExceptionsClient() {
  const authStore = useAuthStore()
  const confirm = useConfirm()
  const employeeId = authStore.currentUser.value?.id ?? null

  const store = useMemo(() => (employeeId ? new MyExceptionsStore(employeeId) : null), [employeeId])

  const [formState, setFormState] = useState<FormState>({ kind: 'closed' })

  useEffect(() => {
    if (!store) return
    void store.fetch()
  }, [store])

  if (!store) {
    return (
      <>
        <AppHeader title="Мои исключения" />
        <div className={s.container}>
          <div className={s.empty}>Войдите в систему, чтобы увидеть свои исключения.</div>
        </div>
      </>
    )
  }

  const isLoading = !store.loadingStage.isFinished
  const isSubmitting = store.submitStage.isLoading

  const handleOpenCreate = (): void => {
    store.resetError()
    setFormState({ kind: 'create' })
  }

  const handleCancel = (): void => {
    store.resetError()
    setFormState({ kind: 'closed' })
  }

  const handleEdit = (exception: ScheduleException): void => {
    store.resetError()
    setFormState({ kind: 'edit', exception })
  }

  const handleSubmit = async (
    payload: CreateScheduleExceptionPayload | UpdateScheduleExceptionPayload
  ): Promise<boolean> => {
    if (formState.kind === 'create') {
      const ok = await store.create(payload as CreateScheduleExceptionPayload)
      if (ok) {
        toast.success('Исключение добавлено')
        setFormState({ kind: 'closed' })
      }
      return ok
    }
    if (formState.kind === 'edit') {
      const ok = await store.update(
        formState.exception.id,
        payload as UpdateScheduleExceptionPayload
      )
      if (ok) {
        toast.success('Исключение обновлено')
        setFormState({ kind: 'closed' })
      }
      return ok
    }
    return false
  }

  const handleDelete = async (): Promise<boolean> => {
    if (formState.kind !== 'edit') return false
    const exc = formState.exception
    const ok = await confirm({
      title: 'Удалить исключение?',
      body: 'Это действие нельзя отменить. Связанные уведомления коллегам не отзываются.',
      confirmLabel: 'Удалить',
      cancelLabel: 'Отмена',
      danger: true,
    })
    if (!ok) return false
    const removed = await store.remove(exc.id)
    if (removed) {
      toast.success('Исключение удалено')
      setFormState({ kind: 'closed' })
    }
    return removed
  }

  const formMode: InlineExceptionFormMode | null =
    formState.kind === 'create'
      ? { kind: 'create' }
      : formState.kind === 'edit'
        ? { kind: 'edit', initial: formState.exception }
        : null

  return (
    <>
      <AppHeader
        title="Мои исключения"
        action={
          formState.kind === 'closed' && (
            <Button
              variant="primary"
              size="md"
              leftIcon={<PlusIcon />}
              onClick={handleOpenCreate}
              disabled={isLoading}
            >
              Добавить исключение
            </Button>
          )
        }
      />
      <div className={s.container}>
        <Card padding="md" className={s.infoBanner}>
          <span className={s.infoIcon}>
            <InfoIcon width={18} height={18} />
          </span>
          <div className={s.infoText}>
            Исключения автоматически учитываются при поиске окна для встреч. Ваши коллеги не видят
            причину — только статус недоступности.
          </div>
        </Card>

        <div className={s.grid}>
          <div className={s.main}>
            <Card padding="lg">
              <CardHeader
                title="Активные и предстоящие"
                action={
                  <Badge tone="info" size="sm" pill>
                    {store.activeAndUpcoming.length}
                  </Badge>
                }
              />
              {isLoading ? (
                <div className={s.placeholder}>Загружаем исключения…</div>
              ) : store.activeAndUpcoming.length === 0 ? (
                <div className={s.placeholder}>Запланированных исключений нет.</div>
              ) : (
                <div className={s.list}>
                  {store.activeAndUpcoming.map((exception) => (
                    <ExceptionCard key={exception.id} exception={exception} onEdit={handleEdit} />
                  ))}
                </div>
              )}
            </Card>

            {formMode && (
              <Card padding="lg">
                <InlineExceptionForm
                  mode={formMode}
                  isSubmitting={isSubmitting}
                  error={store.lastError}
                  onSubmit={handleSubmit}
                  onCancel={handleCancel}
                  onDelete={formMode.kind === 'edit' ? handleDelete : undefined}
                />
              </Card>
            )}

            <Card padding="lg">
              <CardHeader
                title="Прошедшие"
                action={
                  <Badge tone="neutral" size="sm" pill>
                    {store.past.length}
                  </Badge>
                }
              />
              {isLoading ? (
                <div className={s.placeholder}>Загружаем историю…</div>
              ) : store.past.length === 0 ? (
                <div className={s.placeholder}>Прошедших исключений нет.</div>
              ) : (
                <div className={s.list}>
                  {store.past.map((exception) => (
                    <ExceptionCard key={exception.id} exception={exception} muted />
                  ))}
                </div>
              )}
            </Card>
          </div>

          <aside className={s.sidebar}>
            <Card padding="lg">
              <CardHeader title="Календарь" />
              <MiniCalendar exceptions={store.exceptions.value} />
            </Card>
            <Card padding="lg">
              <CardHeader title="Влияние на команду" />
              <ImpactPanel exceptions={store.exceptions.value} events={store.events.value} />
            </Card>
          </aside>
        </div>
      </div>
    </>
  )
})
