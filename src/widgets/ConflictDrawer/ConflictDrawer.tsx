'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { toast } from 'sonner'

import { useConflictsStore } from '@/app-store/context'
import { AlternativeWindow, ConflictEvent } from '@/entities/conflict/model/types'
import { ApiError } from '@/shared/api/client'
import { Button } from '@/shared/ui/Button'

import s from './ConflictDrawer.module.scss'

function formatDateTime(iso: string, timezone: string): string {
  return new Date(iso).toLocaleString('ru-RU', {
    timeZone: timezone,
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatLocalRange(startIso: string, endIso: string): string {
  const start = new Date(startIso)
  const end = new Date(endIso)
  const dateLabel = start.toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  })
  const timeLabel = `${start.toLocaleTimeString('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
  })}–${end.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
  return `${dateLabel}, ${timeLabel}`
}

function formatScheduleRange(start: string | null, end: string | null): string | null {
  if (!start || !end) return null
  return `${start.slice(0, 5)}–${end.slice(0, 5)}`
}

export const ConflictDrawer = observer(function ConflictDrawer() {
  const store = useConflictsStore()
  const event = store.selectedEvent.value

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') store.closeDrawer()
    }
    if (event) {
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
  }, [event, store])

  if (!event) return null

  return (
    <>
      <div className={s.backdrop} onClick={() => store.closeDrawer()} aria-hidden />
      <aside className={s.drawer} role="dialog" aria-modal="true" aria-label="Конфликт">
        <header className={s.header}>
          <div className={s.headerText}>
            <span className={s.outsideBadge}>Вне графика</span>
            <h2 className={s.title}>{event.title}</h2>
          </div>
          <button
            type="button"
            className={s.closeBtn}
            onClick={() => store.closeDrawer()}
            aria-label="Закрыть"
          >
            ×
          </button>
        </header>

        <EventDetails event={event} />
        <Alternatives event={event} />
      </aside>
    </>
  )
})

function EventDetails({ event }: { event: ConflictEvent }) {
  const scheduleRange = formatScheduleRange(event.scheduleStartTime, event.scheduleEndTime)
  return (
    <>
      <section className={s.section}>
        <h3 className={s.sectionTitle}>Событие</h3>
        <div className={s.row}>
          <span className={s.rowLabel}>Сотрудник</span>
          <Link href={`/employees/${event.employeeId}`} className={s.employeeLink}>
            {event.employeeFullName}
          </Link>
        </div>
        {event.teamName && (
          <div className={s.row}>
            <span className={s.rowLabel}>Команда</span>
            <span>{event.teamName}</span>
          </div>
        )}
        <div className={s.row}>
          <span className={s.rowLabel}>Время</span>
          <span>{formatDateTime(event.startDt, event.timezone)}</span>
        </div>
        <div className={s.row}>
          <span className={s.rowLabel}>Часовой пояс</span>
          <span>{event.timezone}</span>
        </div>
        <div className={s.row}>
          <span className={s.rowLabel}>Источник</span>
          <span>{event.source}</span>
        </div>
      </section>

      <section className={s.section}>
        <h3 className={s.sectionTitle}>Почему конфликт</h3>
        <div className={s.reasonBlock}>
          {scheduleRange
            ? `Рабочий график сотрудника: ${scheduleRange}. Событие выходит за его пределы.`
            : 'У сотрудника нет активного графика — все события классифицируются как вне графика.'}
        </div>
      </section>
    </>
  )
}

const Alternatives = observer(function Alternatives({ event }: { event: ConflictEvent }) {
  const store = useConflictsStore()
  const items = store.alternatives.value
  const loading = store.alternativesLoadingStage.isLoading
  const errored = store.alternativesLoadingStage.isError

  const handlePropose = async (alt: AlternativeWindow) => {
    try {
      await store.propose(event.id, {
        alternative_start_dt: alt.startDt,
        alternative_end_dt: alt.endDt,
      })
      toast.success('Предложение отправлено сотруднику')
    } catch (error) {
      const msg =
        error instanceof ApiError
          ? error.message
          : 'Не удалось отправить предложение. Попробуйте ещё раз.'
      toast.error(msg)
    }
  }

  const handleCopy = async (alt: AlternativeWindow) => {
    try {
      await navigator.clipboard.writeText(formatLocalRange(alt.localStart, alt.localEnd))
      toast.success('Время скопировано в буфер')
    } catch {
      toast.error('Не удалось скопировать')
    }
  }

  return (
    <section className={s.section}>
      <h3 className={s.sectionTitle}>Альтернативные окна</h3>
      {loading && <div className={s.emptyAlt}>Подбираем варианты…</div>}
      {errored && <div className={s.emptyAlt}>Не удалось загрузить альтернативы.</div>}
      {!loading && !errored && items.length === 0 && (
        <div className={s.emptyAlt}>
          Нет свободных окон в графике сотрудника на ближайшую неделю.
        </div>
      )}
      <div className={s.altList}>
        {items.map((alt) => {
          const proposed = store.isProposed(event.id, alt)
          return (
            <div key={`${alt.startDt}-${alt.endDt}`} className={s.altCard}>
              <div className={s.altTime}>{formatLocalRange(alt.localStart, alt.localEnd)}</div>
              <div className={s.altReason}>{alt.reason}</div>
              <div className={s.altActions}>
                <Button variant="ghost" size="sm" onClick={() => handleCopy(alt)}>
                  Скопировать
                </Button>
                {proposed ? (
                  <span className={s.proposedLabel}>Отправлено</span>
                ) : (
                  <Button variant="primary" size="sm" onClick={() => handlePropose(alt)}>
                    Предложить перенос
                  </Button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
})
