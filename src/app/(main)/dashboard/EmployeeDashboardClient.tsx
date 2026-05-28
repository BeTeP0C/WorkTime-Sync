'use client'

import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { toast } from 'sonner'

import { useAuthStore } from '@/app-store/context'
import { EmployeeDashboardStore } from '@/app-store/stores/EmployeeDashboardStore'
import { CalendarIcon, CheckSmallIcon, InfoIcon, WarningSmallIcon } from '@/shared/icons'
import { formatScore, pluralizeRu } from '@/shared/lib/format'
import { Button } from '@/shared/ui/Button'
import { Card, CardHeader } from '@/shared/ui/Card'
import { AiQuickAsk } from '@/widgets/AiQuickAsk'
import { GreetingHeader } from '@/widgets/GreetingHeader'
import { StatCard, StatCardSkeleton } from '@/widgets/StatCard'
import { UpcomingEventsList } from '@/widgets/UpcomingEventsList'
import { WeekStrip } from '@/widgets/WeekStrip'

import s from './EmployeeDashboardClient.module.scss'

/** Порог в днях, после которого график считается устаревшим и показывается жёлтый алёрт. */
const STALE_SCHEDULE_WARN_DAYS = 30

const DEFAULT_AI_HINT =
  'Спросите AI о своей нагрузке, конфликтах встреч или удобном времени для команды.'

function aiTone(value: number): 'default' | 'warning' | 'critical' {
  if (value < 0.4) return 'critical'
  if (value < 0.7) return 'warning'
  return 'default'
}

function liTone(value: number): 'default' | 'warning' | 'critical' {
  if (value > 1.0) return 'critical'
  if (value > 0.8) return 'warning'
  return 'default'
}

function ciTone(value: number): 'default' | 'warning' | 'critical' {
  if (value > 0.35) return 'critical'
  if (value > 0.15) return 'warning'
  return 'default'
}

interface EmployeeDashboardClientProps {
  /** id текущего пользователя. У роли employee он равен currentUser.id. */
  userId: string
}

export const EmployeeDashboardClient = observer(function EmployeeDashboardClient({
  userId,
}: EmployeeDashboardClientProps) {
  const auth = useAuthStore()
  const user = auth.currentUser.value

  const [store] = useState(() => new EmployeeDashboardStore(userId))

  useEffect(() => {
    void store.fetch()
  }, [store])

  const employee = store.employee.value
  const metric = employee?.metric ?? null
  const days = store.daysSinceConfirm
  const isStale = days !== null && days >= STALE_SCHEDULE_WARN_DAYS
  const isLoading = store.loadingStage.isInitial || store.loadingStage.isLoading
  const isErrored = store.loadingStage.isError
  const topRecommendation = store.topRecommendation

  const firstName =
    employee?.firstName?.trim() || user?.fullName.split(/\s+/)[0] || user?.fullName || ''

  const aiHintText = topRecommendation
    ? `${firstName ? firstName + ', ' : ''}${topRecommendation.reason}. Рекомендуем: ${topRecommendation.title.toLowerCase()}.`
    : DEFAULT_AI_HINT

  const handleConfirm = async (): Promise<void> => {
    const ok = await store.confirmSchedule()
    if (ok) toast.success('График подтверждён')
    else if (store.lastConfirmError) toast.error(store.lastConfirmError)
  }

  const subtitle = employee?.department || employee?.position || undefined

  return (
    <>
      <GreetingHeader
        fullName={user?.fullName ?? 'Сотрудник'}
        subtitle={subtitle}
        action={
          <Button
            variant="primary"
            size="md"
            leftIcon={<CheckSmallIcon width={16} height={16} />}
            onClick={() => void handleConfirm()}
            disabled={store.confirmStage.isLoading || !store.schedule.value}
          >
            Подтвердить актуальность
          </Button>
        }
      />

      {isErrored && (
        <div className={s.errorBlock} role="alert">
          <div className={s.errorTitle}>Не удалось загрузить данные</div>
          <div className={s.errorText}>
            Проверьте соединение и попробуйте снова. Если ошибка повторится — обратитесь к
            администратору.
          </div>
          <Button variant="primary" size="md" onClick={() => void store.fetch()}>
            Повторить
          </Button>
        </div>
      )}

      {isStale && days !== null && (
        <div className={s.staleAlert} role="alert">
          <span className={s.staleIcon} aria-hidden>
            <WarningSmallIcon width={16} height={16} />
          </span>
          <div className={s.staleText}>
            <div className={s.staleTitle}>
              Ваш рабочий график не обновлялся {days} {pluralizeRu(days, ['день', 'дня', 'дней'])}
            </div>
            <div className={s.staleHint}>
              Подтвердите актуальность или обновите данные — это влияет на планирование встреч вашей
              команды.
            </div>
          </div>
          <div className={s.staleActions}>
            <Button
              variant="primary"
              size="sm"
              onClick={() => void handleConfirm()}
              disabled={store.confirmStage.isLoading || !store.schedule.value}
            >
              Обновить сейчас
            </Button>
          </div>
        </div>
      )}

      <div className={s.stats}>
        {isLoading || !metric ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              icon={<CheckSmallIcon width={18} height={18} />}
              label="Актуальность графика Ai"
              value={formatScore(metric.actualityScore)}
              tone={aiTone(metric.actualityScore)}
            />
            <StatCard
              icon={<CalendarIcon width={18} height={18} />}
              label="Загрузка на этой неделе Li"
              value={`${Math.round(metric.loadLevel * 100)}%`}
              tone={liTone(metric.loadLevel)}
              hint={
                <span>
                  {metric.loadLevel > 0.8 ? 'Перегружен (норма до 80%)' : 'В пределах нормы'}
                </span>
              }
            />
            <StatCard
              icon={<InfoIcon width={18} height={18} />}
              label="Встреч вне графика Ci"
              value={`${Math.round(metric.conflictRate * 100)}%`}
              tone={ciTone(metric.conflictRate)}
              hint={<span>За последние 30 дней</span>}
            />
          </>
        )}
      </div>

      <div className={s.layout}>
        <div className={s.main}>
          <WeekStrip days={store.weekBuckets} />

          <AiQuickAsk hintText={aiHintText} badge="Новое" />
        </div>

        <aside className={s.aside}>
          <UpcomingEventsList events={store.upcomingEvents} />

          <Card padding="lg">
            <CardHeader title="Мои показатели за месяц" />
            <div className={s.metricRow}>
              <span className={s.metricLabel}>Дней без обновления</span>
              <span className={isStale ? s.metricValueWarn : s.metricValue}>{days ?? '—'}</span>
            </div>
            <div className={s.metricRow}>
              <span className={s.metricLabel}>Встреч всего</span>
              <span className={s.metricValue}>{metric?.totalEventsCount ?? '—'}</span>
            </div>
            <div className={s.metricRow}>
              <span className={s.metricLabel}>Вне графика</span>
              <span className={s.metricValue}>
                {metric
                  ? `${metric.outsideEventsCount} (${Math.round(metric.conflictRate * 100)}%)`
                  : '—'}
              </span>
            </div>
            <div className={s.metricRow}>
              <span className={s.metricLabel}>Часовой пояс</span>
              <span className={s.metricValue}>
                {employee?.timezoneLabel || employee?.timezone || '—'}
              </span>
            </div>
          </Card>
        </aside>
      </div>
    </>
  )
})
