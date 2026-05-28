'use client'

import { useEffect, useMemo, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { toast } from 'sonner'

import { useAuthStore } from '@/app-store/context'
import { EmployeeProfileStore } from '@/app-store/stores/EmployeeProfileStore'
import { getEmployeeEvents } from '@/entities/activity-event/api'
import { ActivityEvent } from '@/entities/activity-event/model/types'
import { CreateWorkSchedulePayload } from '@/entities/schedule/api'
import { getScheduleDiagnostics, ScheduleDiagnostics } from '@/entities/schedule/api/diagnostics'
import { TIMEZONE_OPTIONS, WORK_FORMAT_OPTIONS } from '@/entities/schedule/model/options'
import { WeekDayIndex, WorkFormat } from '@/entities/schedule/model/types'
import { validateSchedulePayload } from '@/entities/schedule/model/validation'
import { WeekdayChips } from '@/entities/schedule/ui/WeekdayChips'
import { AlertBanner } from '@/shared/ui/AlertBanner'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'
import { Input } from '@/shared/ui/Input'
import { Select, SelectOption } from '@/shared/ui/Select'
import { Textarea } from '@/shared/ui/Textarea'
import { AppHeader } from '@/widgets/AppHeader'

import { AvailabilityPreview } from './components/AvailabilityPreview'
import { MismatchAlert } from './components/MismatchAlert'
import { TeamImpact } from './components/TeamImpact'

import s from './MyScheduleClient.module.scss'

const DEFAULT_WORK_DAYS: WeekDayIndex[] = [0, 1, 2, 3, 4]
const DEFAULT_START = '09:00'
const DEFAULT_END = '18:00'
const DEFAULT_TZ = 'Europe/Moscow'
const DEFAULT_FORMAT: WorkFormat = 'office'

interface FormState {
  workDays: WeekDayIndex[]
  startTime: string
  endTime: string
  timezone: string
  workFormat: WorkFormat
}

export const MyScheduleClient = observer(function MyScheduleClient() {
  const auth = useAuthStore()
  const userId = auth.currentUser.value?.id ?? null

  const store = useMemo(() => (userId ? new EmployeeProfileStore(userId) : null), [userId])

  useEffect(() => {
    if (store && !store.loadingStage.isSuccessful) void store.fetch()
  }, [store])

  const [diagnostics, setDiagnostics] = useState<ScheduleDiagnostics | null>(null)
  const [events, setEvents] = useState<ActivityEvent[] | null>(null)
  const [eventsLoading, setEventsLoading] = useState(false)

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    void (async () => {
      try {
        const d = await getScheduleDiagnostics(userId)
        if (!cancelled) setDiagnostics(d)
      } catch (error) {
        console.error('[MyScheduleClient] diagnostics failed', error)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId, store?.schedule.value?.id])

  useEffect(() => {
    if (!userId) return
    let cancelled = false
    setEventsLoading(true)
    void (async () => {
      try {
        const list = await getEmployeeEvents(userId)
        if (!cancelled) setEvents(list)
      } catch (error) {
        console.error('[MyScheduleClient] events failed', error)
      } finally {
        if (!cancelled) setEventsLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [userId])

  const employee = store?.employee.value ?? null
  const schedule = store?.schedule.value ?? null

  const initial = useMemo<FormState>(
    () => ({
      workDays: schedule?.workDays ?? DEFAULT_WORK_DAYS,
      startTime: schedule?.startTime ?? DEFAULT_START,
      endTime: schedule?.endTime ?? DEFAULT_END,
      timezone: schedule?.timezone ?? employee?.timezone ?? DEFAULT_TZ,
      workFormat: schedule?.workFormat ?? employee?.workFormat ?? DEFAULT_FORMAT,
    }),
    [schedule, employee]
  )

  const [form, setForm] = useState<FormState>(initial)
  // Комментарий — пока UI-only affordance: на бэке у POST /schedules нет поля
  // reason. Когда оно появится, прокинем сюда через CreateWorkSchedulePayload.
  const [comment, setComment] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)

  // Подтягиваем актуальные значения, когда расписание подгружается из API.
  useEffect(() => {
    setForm(initial)
  }, [initial])

  const isSubmitting = store?.editStage.isLoading ?? false
  const isConfirming = store?.confirmStage.isLoading ?? false
  const apiError = store?.lastEditError ?? null

  const isDirty = useMemo(() => {
    if (
      form.startTime !== initial.startTime ||
      form.endTime !== initial.endTime ||
      form.timezone !== initial.timezone ||
      form.workFormat !== initial.workFormat ||
      form.workDays.length !== initial.workDays.length
    ) {
      return true
    }
    // Дни сравниваем как множества: бэк/сид может прислать неотсортированный
    // массив, а WeekdayChips отдаёт отсортированный — это не «грязное» изменение.
    const a = [...form.workDays].sort((x, y) => x - y)
    const b = [...initial.workDays].sort((x, y) => x - y)
    return a.some((d, i) => d !== b[i])
  }, [form, initial])

  const timezoneOptions = useMemo<SelectOption<string>[]>(() => {
    if (form.timezone && !TIMEZONE_OPTIONS.some((o) => o.value === form.timezone)) {
      return [{ value: form.timezone, label: form.timezone }, ...TIMEZONE_OPTIONS]
    }
    return TIMEZONE_OPTIONS
  }, [form.timezone])

  const handleReset = (): void => {
    setForm(initial)
    setComment('')
    setValidationError(null)
  }

  const buildPayload = (): CreateWorkSchedulePayload => ({
    workDays: form.workDays,
    startTime: form.startTime,
    endTime: form.endTime,
    timezone: form.timezone,
    workFormat: form.workFormat,
  })

  const handleSave = async (): Promise<void> => {
    if (!store) return
    const payload = buildPayload()
    const validation = validateSchedulePayload(payload)
    if (validation) {
      setValidationError(validation)
      return
    }
    setValidationError(null)
    const ok = await store.createSchedule(payload)
    if (ok) {
      toast.success('Рабочий график сохранён')
      setComment('')
    }
  }

  const handleConfirm = async (): Promise<void> => {
    if (!store) return
    await store.confirmSchedule()
    toast.success('Актуальность графика подтверждена')
  }

  if (!userId || !store) return null

  return (
    <div className={s.page}>
      <AppHeader
        title="Рабочий график"
        action={
          <div className={s.headerActions}>
            <Button
              variant="secondary"
              size="md"
              onClick={handleReset}
              disabled={!isDirty || isSubmitting}
            >
              Отменить
            </Button>
            <Button variant="primary" size="md" onClick={handleSave} disabled={isSubmitting}>
              ✓ Сохранить изменения
            </Button>
          </div>
        }
      />

      <div className={s.layout}>
        <div className={s.main}>
          <AlertBanner tone="info">
            Актуальный рабочий график помогает команде планировать встречи без конфликтов.
            Пожалуйста, проверьте все поля и сохраните изменения.
          </AlertBanner>

          <Card padding="lg">
            <CardHeader title="Стандартный рабочий график" />

            <div className={s.grid2}>
              <Input
                label="Рабочие часы — начало"
                type="time"
                step={900}
                value={form.startTime}
                onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
                disabled={isSubmitting}
                fullWidth
              />
              <Input
                label="Рабочие часы — конец"
                type="time"
                step={900}
                value={form.endTime}
                onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
                disabled={isSubmitting}
                fullWidth
              />
            </div>

            <div className={s.grid2}>
              <div className={s.fieldGroup}>
                <div className={s.fieldLabel}>Часовой пояс</div>
                <Select
                  value={form.timezone}
                  onValueChange={(v) => v && setForm((f) => ({ ...f, timezone: v }))}
                  options={timezoneOptions}
                  placeholder="Выберите часовой пояс"
                  disabled={isSubmitting}
                />
              </div>
              <div className={s.fieldGroup}>
                <div className={s.fieldLabel}>Формат работы</div>
                <Select
                  value={form.workFormat}
                  onValueChange={(v) => v && setForm((f) => ({ ...f, workFormat: v }))}
                  options={WORK_FORMAT_OPTIONS}
                  placeholder="Выберите формат работы"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div className={s.fieldGroup}>
              <div className={s.fieldLabel}>Рабочие дни</div>
              <WeekdayChips
                value={form.workDays}
                onChange={(next) => setForm((f) => ({ ...f, workDays: next }))}
                disabled={isSubmitting}
              />
            </div>

            {diagnostics?.shouldShowAlert && <MismatchAlert diagnostics={diagnostics} />}

            <Textarea
              label="Комментарий к изменению (необязательно)"
              placeholder="Например: временно работаю из другого города…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              disabled={isSubmitting}
              rows={3}
              fullWidth
            />

            {(validationError || apiError) && (
              <AlertBanner tone="error">{validationError || apiError}</AlertBanner>
            )}

            <div className={s.footerActions}>
              <button
                type="button"
                className={s.confirmBtn}
                onClick={handleConfirm}
                disabled={isConfirming || isDirty}
                title={isDirty ? 'Сначала сохраните изменения или нажмите «Отменить»' : undefined}
              >
                ✓ Всё верно — подтвердить
              </button>
              <Button variant="primary" size="md" onClick={handleSave} disabled={isSubmitting}>
                Сохранить изменения
              </Button>
            </div>
          </Card>
        </div>

        <aside className={s.sidebar}>
          <AvailabilityPreview
            startTime={form.startTime}
            endTime={form.endTime}
            events={events}
            isLoading={eventsLoading}
          />
          <TeamImpact startTime={form.startTime} endTime={form.endTime} timezone={form.timezone} />
        </aside>
      </div>
    </div>
  )
})
