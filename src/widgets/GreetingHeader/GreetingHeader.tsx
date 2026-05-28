import { ReactNode } from 'react'
import { format, parseISO } from 'date-fns'
import { ru } from 'date-fns/locale'

import { NotificationsBell } from '@/widgets/NotificationsBell'

import s from './GreetingHeader.module.scss'

interface GreetingHeaderProps {
  /** Полное имя или только имя — будет использовано первое слово. */
  fullName: string
  /** ISO-дата. По умолчанию — сегодня. */
  dateIso?: string
  /** Подзаголовок: команда / отдел. */
  subtitle?: ReactNode
  /** Слот для CTA-кнопок справа (например, «Подтвердить актуальность»). */
  action?: ReactNode
}

function pickGreeting(hour: number): string {
  if (hour < 5) return 'Доброй ночи'
  if (hour < 12) return 'Доброе утро'
  if (hour < 18) return 'Добрый день'
  return 'Добрый вечер'
}

function pickFirstName(fullName: string): string {
  // По соглашению проекта (см. entities/employee/lib/normalize.ts → splitName)
  // fullName хранится как «Имя Фамилия»: имя — первое слово.
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  return parts[0] ?? ''
}

export function GreetingHeader({ fullName, dateIso, subtitle, action }: GreetingHeaderProps) {
  const date = dateIso ? parseISO(dateIso) : new Date()
  const firstName = pickFirstName(fullName)
  const greeting = pickGreeting(date.getHours())
  const dateLabel = format(date, 'EEEE, d MMMM yyyy', { locale: ru })

  return (
    <header className={s.header}>
      <div className={s.text}>
        <h1 className={s.title}>
          {greeting}, {firstName}{' '}
          <span className={s.wave} aria-hidden>
            👋
          </span>
        </h1>
        <div className={s.meta}>
          {subtitle && <span className={s.subtitle}>{subtitle}</span>}
          {subtitle && (
            <span className={s.dot} aria-hidden>
              ·
            </span>
          )}
          <span className={s.date}>{dateLabel}</span>
        </div>
      </div>
      <div className={s.actions}>
        {action}
        <NotificationsBell />
      </div>
    </header>
  )
}
